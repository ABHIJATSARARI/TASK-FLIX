const axios = require('axios');
const { getIBMToken } = require('./authService');
require('dotenv').config();

/**
 * Call IBM Granite API with the instruct-based model format
 * @param {string} prompt - The prompt to send to the API
 * @param {number} maxTokens - Maximum number of tokens to generate
 * @returns {Promise<Object>} - The API response
 */
const callGraniteAPI = async (prompt, maxTokens = 200) => {
  try {
    const token = await getIBMToken();
    const url = process.env.IBM_URL || "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29";
    const modelId = process.env.IBM_MODEL_ID || "ibm/granite-13b-instruct-v2";
    const projectId = process.env.IBM_PROJECT_ID;
    
    // Validate that required environment variables are present
    if (!projectId) {
      console.warn('Warning: IBM_PROJECT_ID environment variable not set');
    }
    
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
    
    // Using environment variables for API parameters
    const body = {
      input: prompt,
      parameters: {
        decoding_method: process.env.IBM_DECODING_METHOD || "greedy",
        max_new_tokens: maxTokens,
        min_new_tokens: 0,
        stop_sequences: [],
        repetition_penalty: Number(process.env.IBM_REPETITION_PENALTY) || 1
      },
      model_id: modelId,
      project_id: projectId,
      moderations: {
        hap: {
          input: {
            enabled: true,
            threshold: 0.5,
            mask: {
              remove_entity_value: true
            }
          },
          output: {
            enabled: true,
            threshold: 0.5,
            mask: {
              remove_entity_value: true
            }
          }
        },
        pii: {
          input: {
            enabled: true,
            threshold: 0.5,
            mask: {
              remove_entity_value: true
            }
          },
          output: {
            enabled: true,
            threshold: 0.5,
            mask: {
              remove_entity_value: true
            }
          }
        }
      }
    };

    console.log('Calling IBM Granite API with:', { url, modelId, projectId: projectId ? 'configured' : 'missing' });
    const response = await axios({
      url,
      headers,
      method: "POST",
      data: body
    });
    
    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error calling Granite API:', error.response?.data || error.message);
    throw new Error('Failed to generate content with Granite API');
  }
};

/**
 * Extract valid JSON from text that might contain non-JSON content
 * @param {string} text - Text that might contain JSON
 * @returns {Object|null} - Parsed JSON object or null if parsing failed
 */
function extractJSONFromText(text) {
  if (!text) return null;
  
  console.log('Attempting to extract JSON from:', text.substring(0, 100) + '...');
  
  // Try direct parsing first
  try {
    return JSON.parse(text);
  } catch (e) {
    console.log('Direct JSON parsing failed, trying to extract JSON content');
  }
  
  // Try to find JSON-like content using regex patterns
  try {
    // Look for content between curly braces
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const potentialJson = jsonMatch[0];
      console.log('Found potential JSON:', potentialJson.substring(0, 50) + '...');
      try {
        return JSON.parse(potentialJson);
      } catch (e) {
        console.log('Failed to parse extracted JSON with braces');
      }
    }
    
    // Advanced parsing: try to find key-value pairs if the above failed
    const keyValuePattern = /(["']?)(\w+)\1\s*:\s*(["'])((?:(?=(\\?))\5.)*?)\3/g;
    let matches = [...text.matchAll(keyValuePattern)];
    if (matches.length > 0) {
      const extractedObj = {};
      matches.forEach(match => {
        const key = match[2];
        const value = match[4];
        extractedObj[key] = value;
      });
      if (Object.keys(extractedObj).length > 0) {
        console.log('Constructed object from key-value pairs:', extractedObj);
        return extractedObj;
      }
    }
    
    return null;
  } catch (e) {
    console.error('JSON extraction error:', e);
    return null;
  }
}

/**
 * Transform a task into a quest narrative
 * @param {string} taskTitle - The title of the task
 * @param {string} category - The category of the task
 * @param {string} difficulty - The difficulty level of the task
 * @returns {Promise<Object>} - Quest title and narrative
 */
const transformTaskToQuest = async (taskTitle, category, difficulty) => {
  const prompt = `Transform this ordinary task into an engaging fantasy quest narrative:

Task: "${taskTitle}"
Category: ${category}
Difficulty: ${difficulty}

Return a JSON object with these fields:
- questTitle: A creative fantasy-themed title (maximum 60 characters)
- questNarrative: A short narrative (2-3 sentences) that transforms the task into an adventure`;

  try {
    const response = await callGraniteAPI(prompt, 200);
    console.log('Quest generation API response received');
    
    // Log the full response for debugging
    console.log('Raw API response structure:', JSON.stringify(response, null, 2));
    
    // Extract the generated text from the IBM Granite response format
    if (response.results && response.results[0]?.generated_text) {
      const generatedText = response.results[0].generated_text;
      console.log('Generated text:', generatedText);
      
      // If generatedText is already a JSON object
      if (typeof generatedText === 'object' && 
          generatedText.questTitle && 
          generatedText.questNarrative) {
        return {
          questTitle: generatedText.questTitle,
          questNarrative: generatedText.questNarrative
        };
      }
      
      // If generatedText is a string, attempt to extract JSON
      if (typeof generatedText === 'string') {
        const parsedJson = extractJSONFromText(generatedText);
        if (parsedJson && parsedJson.questTitle && parsedJson.questNarrative) {
          return {
            questTitle: parsedJson.questTitle,
            questNarrative: parsedJson.questNarrative
          };
        }
        
        // Manual extraction as last resort
        console.log('Attempting manual extraction from generated text');
        const titleMatch = generatedText.match(/questTitle["\s:]+([^"]+)/);
        const narrativeMatch = generatedText.match(/questNarrative["\s:]+([^"]+)/);
        
        if (titleMatch && narrativeMatch) {
          return {
            questTitle: titleMatch[1].trim().replace(/[,"}\s]+$/, ''),
            questNarrative: narrativeMatch[1].trim().replace(/[,"}\s]+$/, '')
          };
        }
      }
    }
    
    // If we couldn't get a proper JSON response, fall back
    console.warn('Could not extract valid quest data from API response');
    throw new Error('Invalid response format from IBM Granite API');
  } catch (error) {
    console.error('Error transforming task to quest:', error);
    // Fallback in case of API error
    return {
      questTitle: `Quest: ${taskTitle}`,
      questNarrative: `A brave adventurer must complete ${taskTitle} to help the kingdom thrive.`
    };
  }
};

/**
 * Generate a motivational message
 * @returns {Promise<string>} - The motivational message
 */
const generateMotivationalMessage = async () => {
  // Use a much simpler prompt to ensure the API responds correctly
  const prompt = `Generate a short motivational message for a fantasy-themed task management app. 
The message should be encouraging and use fantasy language.
Return ONLY the message text with no formatting or JSON.`;

  try {
    const response = await callGraniteAPI(prompt, 100);
    console.log('Motivational message API response received');
    
    // Log the full response for debugging
    console.log('Raw API response structure:', JSON.stringify(response, null, 2));
    
    // Check if we have valid content in the response
    if (response.results && 
        response.results[0]?.generated_text) {
      
      const generatedText = response.results[0].generated_text;
      console.log('Generated text:', generatedText);
      
      // Check for empty or too-short responses
      if (!generatedText || generatedText.trim().length <= 2) {
        console.log('Empty or too short response received, using fallback');
        throw new Error('Empty response from IBM Granite API');
      }
      
      // If generatedText is already a JSON object with motivationalMessage
      if (typeof generatedText === 'object' && generatedText.motivationalMessage) {
        return generatedText.motivationalMessage;
      }
      
      // If it's just text (as requested in our simplified prompt), use it directly
      if (typeof generatedText === 'string' && generatedText.length > 5) {
        return generatedText.trim();
      }
      
      // Try JSON parsing if it looks like JSON
      if (typeof generatedText === 'string' && 
          (generatedText.includes('{') || generatedText.includes('motivationalMessage'))) {
        try {
          const parsed = JSON.parse(generatedText);
          if (parsed.motivationalMessage) {
            return parsed.motivationalMessage;
          }
        } catch (e) {
          console.log('Direct JSON parsing failed, trying other methods');
        }
        
        // Try to extract using regex if it looks like it contains a message
        if (generatedText.includes('motivationalMessage') || generatedText.includes('"')) {
          const parsedJson = extractJSONFromText(generatedText);
          if (parsedJson && parsedJson.motivationalMessage) {
            return parsedJson.motivationalMessage;
          }
          
          // Look specifically for motivationalMessage pattern
          const messageMatch = generatedText.match(/motivationalMessage["\s:]+([^"]+)/);
          if (messageMatch) {
            return messageMatch[1].trim().replace(/[,"}\s]+$/, '');
          }
          
          // Look for quotes that might contain the message
          const quotesMatch = generatedText.match(/"([^"]+)"/);
          if (quotesMatch) {
            return quotesMatch[1].trim();
          }
        }
      }
    }
    
    // If we couldn't get a proper response, throw error to trigger fallback
    throw new Error('Invalid or empty response from IBM Granite API');
  } catch (error) {
    console.error('Error generating motivational message:', error);
    // Fallback messages in case of API error - expanded list for more variety
    const fallbackMessages = [
      "Every hero's journey begins with a single quest. Keep going!",
      "The bards will sing of your achievements when all your quests are done!",
      "Your quests await, brave adventurer! Glory and rewards lie ahead!",
      "Even the mightiest dragons are defeated one scale at a time. Stay persistent!",
      "Your legend grows with every task you complete, brave champion!",
      "Through trials and tribulations, heroes are forged. Press onward!",
      "The path to glory is paved with completed quests. Each step brings you closer!",
      "Raise your banner high, for today's victories become tomorrow's legends!",
      "Magic flows through your dedication. The realm prospers with each task you complete!",
      "Like a phoenix rising, your determination ignites the path forward!",
      "The stars themselves chart your course to victory. Keep following their light!",
      "Your sword is sharp, your shield is strong. No quest is beyond your reach!"
    ];
    return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
  }
};

/**
 * Generate a badge for an achievement
 * @param {string} achievementType - The type of achievement
 * @param {string} milestone - The milestone description
 * @returns {Promise<Object>} - The badge name and description
 */
const generateAchievementBadge = async (achievementType, milestone) => {
  const prompt = `Create a fantasy-themed achievement badge for:
Achievement type: ${achievementType}
Milestone: ${milestone}

Return a JSON object with these fields:
- badgeName: A creative fantasy-themed name for the achievement
- badgeDescription: A short description explaining the achievement in fantasy language`;

  try {
    const response = await callGraniteAPI(prompt, 200);
    console.log('Badge generation API response received');
    
    // Log the full response for debugging
    console.log('Raw API response structure:', JSON.stringify(response, null, 2));
    
    // Extract the generated text from the IBM Granite response format
    if (response.results && response.results[0]?.generated_text) {
      const generatedText = response.results[0].generated_text;
      console.log('Generated text:', generatedText);
      
      // If generatedText is already a JSON object
      if (typeof generatedText === 'object' && 
          generatedText.badgeName && 
          generatedText.badgeDescription) {
        return {
          badgeName: generatedText.badgeName,
          badgeDescription: generatedText.badgeDescription,
          iconType: determineIconType(achievementType, generatedText.badgeName)
        };
      }
      
      // If generatedText is a string, attempt to extract JSON
      if (typeof generatedText === 'string') {
        const parsedJson = extractJSONFromText(generatedText);
        if (parsedJson && parsedJson.badgeName && parsedJson.badgeDescription) {
          return {
            badgeName: parsedJson.badgeName,
            badgeDescription: parsedJson.badgeDescription,
            iconType: determineIconType(achievementType, parsedJson.badgeName)
          };
        }
        
        // Manual extraction as last resort
        console.log('Attempting manual extraction from generated text');
        const nameMatch = generatedText.match(/badgeName["\s:]+([^"]+)/);
        const descMatch = generatedText.match(/badgeDescription["\s:]+([^"]+)/);
        
        if (nameMatch && descMatch) {
          const badgeName = nameMatch[1].trim().replace(/[,"}\s]+$/, '');
          return {
            badgeName: badgeName,
            badgeDescription: descMatch[1].trim().replace(/[,"}\s]+$/, ''),
            iconType: determineIconType(achievementType, badgeName)
          };
        }
      }
    }
    
    // If we couldn't get a proper response, fall back
    throw new Error('Invalid response format from IBM Granite API');
  } catch (error) {
    console.error('Error generating achievement badge:', error);
    // Fallback in case of API error
    return {
      badgeName: `${achievementType.charAt(0).toUpperCase() + achievementType.slice(1)} Master`,
      badgeDescription: `You've reached the impressive milestone of ${milestone}. The kingdom honors your dedication!`,
      iconType: determineIconType(achievementType)
    };
  }
};

/**
 * Helper function to determine the icon type based on achievement type
 */
function determineIconType(achievementType, badgeName = '') {
  // Map common achievement types to appropriate icons
  const typeMappings = {
    streak: 'flame',
    quest: 'scroll',
    completion: 'trophy',
    daily: 'calendar',
    speed: 'lightning',
    first: 'star',
    consistent: 'medal',
    master: 'crown',
  };
  
  // Check for keywords in the badge name
  const nameLower = badgeName.toLowerCase();
  const nameKeywords = {
    flame: ['flame', 'fire', 'burning', 'blaze'],
    crown: ['king', 'queen', 'royal', 'crown', 'ruler', 'sovereign'],
    scroll: ['knowledge', 'wisdom', 'scroll', 'book', 'tome'],
    shield: ['shield', 'protect', 'defend', 'guard', 'bastion'],
    gem: ['gem', 'jewel', 'diamond', 'ruby', 'emerald', 'sapphire'],
    sword: ['sword', 'blade', 'warrior', 'knight', 'battle'],
    trophy: ['champion', 'victory', 'triumph', 'winner', 'conqueror'],
    medal: ['medal', 'honor', 'prestige', 'distinction'],
    star: ['star', 'celestial', 'cosmic', 'astral'],
    lightning: ['lightning', 'thunder', 'storm', 'swift', 'quick', 'fast'],
    calendar: ['time', 'day', 'week', 'daily', 'calendar']
  };
  
  // First check type mappings
  for (const [type, icon] of Object.entries(typeMappings)) {
    if (achievementType.toLowerCase().includes(type)) {
      return icon;
    }
  }
  
  // Then check for keywords in badge name
  for (const [icon, keywords] of Object.entries(nameKeywords)) {
    if (keywords.some(keyword => nameLower.includes(keyword))) {
      return icon;
    }
  }
  
  // Default icon based on achievement type
  if (achievementType.toLowerCase().includes('complete')) return 'trophy';
  if (achievementType.toLowerCase().includes('day')) return 'calendar';
  if (achievementType.toLowerCase().includes('quest')) return 'scroll';
  if (achievementType.toLowerCase().includes('point')) return 'gem';
  
  // Final fallback
  return 'medal';
}

module.exports = {
  transformTaskToQuest,
  generateMotivationalMessage,
  generateAchievementBadge
};