// For MVP testing, using template-based generation by default
// Later will connect to our backend API which uses IBM Granite
import AsyncStorage from '@react-native-async-storage/async-storage';
import { discoverBackendUrl, getApiUrl } from './connectionUtils';

// Configuration for AI functionality
// Use environment variable for backend generation setting
const USE_BACKEND_GENERATION = process.env.EXPO_PUBLIC_USE_BACKEND_GENERATION === 'true' || process.env.EXPO_PUBLIC_USE_BACKEND_GENERATION === true || false;
const ENABLE_SERVER_LOGS = process.env.EXPO_PUBLIC_ENABLE_SERVER_LOGS === 'true' || process.env.EXPO_PUBLIC_ENABLE_SERVER_LOGS === true || true;
const ENABLE_API_CACHE = process.env.EXPO_PUBLIC_ENABLE_API_CACHE === 'true' || process.env.EXPO_PUBLIC_ENABLE_API_CACHE === true || true;

// Cache expiry time - from environment variables or default to 24 hours
const CACHE_EXPIRY = (Number(process.env.EXPO_PUBLIC_CACHE_EXPIRY_HOURS) || 24) * 60 * 60 * 1000;

// Debug logs for configuration
console.log('Backend Generation enabled:', USE_BACKEND_GENERATION);
console.log('USE_BACKEND_GENERATION env value:', process.env.EXPO_PUBLIC_USE_BACKEND_GENERATION);
console.log('Server Logs enabled:', ENABLE_SERVER_LOGS);
console.log('API Caching enabled:', ENABLE_API_CACHE);
console.log('========================================');

// Discover backend URL on startup
let discoveredBackendUrl = null;
(async () => {
  try {
    discoveredBackendUrl = await discoverBackendUrl();
    console.log('Initial backend discovery result:', discoveredBackendUrl ? 'Connected' : 'Not connected');
  } catch (error) {
    console.error('Error during initial backend discovery:', error);
  }
})();

/**
 * Log server API calls and responses if enabled
 */
const logServerComm = (type, endpoint, payload, response = null, error = null) => {
  if (!ENABLE_SERVER_LOGS) return;
  
  const timestamp = new Date().toISOString();
  
  switch (type) {
    case 'request':
      console.group(`🌐 API Request: ${endpoint} - ${timestamp}`);
      console.log(`📤 Sending to endpoint: ${endpoint}`);
      console.log('📤 Payload:', payload);
      console.groupEnd();
      break;
    case 'response':
      console.group(`✅ API Response: ${endpoint} - ${timestamp}`);
      console.log('📥 Response:', response);
      console.groupEnd();
      break;
    case 'error':
      console.group(`❌ API Error: ${endpoint} - ${timestamp}`);
      console.log(`⚠️ Error: ${error.message}`);
      console.log('⚠️ Full error:', error);
      if (payload) console.log('📤 Original payload:', payload);
      console.groupEnd();
      break;
    case 'cache':
      console.log(`🔄 Using cached data for: ${endpoint}`);
      break;
    case 'fallback':
      console.group(`⚠️ Using Fallback: ${endpoint} - ${timestamp}`);
      console.log(`Reason: ${error || 'Unknown'}`);
      console.log(`USE_BACKEND_GENERATION setting: ${USE_BACKEND_GENERATION}`);
      console.log(`USE_BACKEND_GENERATION env: ${process.env.EXPO_PUBLIC_USE_BACKEND_GENERATION}`);
      console.groupEnd();
      break;
  }
};

/**
 * Simple fetch helper for API calls with caching
 */
const callApi = async (endpoint, method = 'GET', body = null) => {
  try {
    // Log attempt to use backend
    console.log(`Attempting API call to ${endpoint}, USE_BACKEND_GENERATION=${USE_BACKEND_GENERATION}`);
    
    // If backend generation is disabled, throw error to fallback to local generation
    if (!USE_BACKEND_GENERATION) {
      throw new Error('Backend generation disabled by configuration');
    }
    
    // Generate cache key from endpoint and body
    const cacheKey = `taskflick_cache_${endpoint}_${body ? JSON.stringify(body) : ''}`;
    
    // Try to get from cache first if caching is enabled
    if (ENABLE_API_CACHE && endpoint !== 'motivational-message') { // Don't cache motivational messages
      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          // Use cache if it's not expired
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            logServerComm('cache', endpoint);
            return data;
          }
        }
      } catch (error) {
        console.error('Cache read error:', error);
      }
    }
    
    // Ensure we have a discovered backend URL
    if (!discoveredBackendUrl) {
      discoveredBackendUrl = await discoverBackendUrl();
      
      // If still no backend URL, throw error
      if (!discoveredBackendUrl) {
        throw new Error('Cannot connect to backend server');
      }
    }
    
    // Get complete API URL
    const fullUrl = await getApiUrl(endpoint, discoveredBackendUrl);
    if (!fullUrl) {
      throw new Error('Failed to construct API URL');
    }
    
    // If no cache or expired, make API call
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`Sending request to: ${fullUrl}`);
    logServerComm('request', endpoint, body);
    
    const response = await fetch(fullUrl, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}): ${errorText}`);
      const error = new Error(`API error: ${response.status} - ${errorText}`);
      logServerComm('error', endpoint, body, null, error);
      throw error;
    }
    
    const result = await response.json();
    console.log('API call successful, response:', result);
    logServerComm('response', endpoint, body, result);
    
    // Cache successful responses if caching is enabled (except motivational messages)
    if (ENABLE_API_CACHE && endpoint !== 'motivational-message' && 
        (result.success === undefined || result.success === true)) {
      try {
        const dataToCache = extractResponseData(result);
        await AsyncStorage.setItem(
          cacheKey, 
          JSON.stringify({ 
            data: dataToCache,
            timestamp: Date.now() 
          })
        );
      } catch (error) {
        console.error('Cache write error:', error);
      }
    }
    
    // Return the properly extracted data
    return extractResponseData(result);
  } catch (error) {
    console.error('API call error:', error.message);
    throw error;
  }
};

/**
 * Helper function to extract the actual data from API responses
 * Handles different response structures consistently
 */
const extractResponseData = (response) => {
  // Handle responses that have success:true format with data in a nested data field
  if (response.success === true && response.data !== undefined) {
    return response.data;
  }
  
  // Handle responses that have success:true format but with data at the top level
  // (like the transform-task endpoint)
  if (response.success === true) {
    // Filter out the success field and return everything else
    const { success, message, ...data } = response;
    return data;
  }
  
  // For direct responses (no success/data wrapping)
  return response;
};

/**
 * Transform a task into a quest using the backend API
 * @param {string} taskTitle - Original task title
 * @param {string} category - Task category
 * @param {string} difficulty - Task difficulty
 * @returns {Promise<Object>} - Quest data with title and narrative
 */
export const transformTaskToQuest = async (taskTitle, category, difficulty) => {
  try {
    console.log(`transformTaskToQuest called: "${taskTitle}", USE_BACKEND_GENERATION=${USE_BACKEND_GENERATION}`);
    
    if (USE_BACKEND_GENERATION) {
      console.log('Attempting to use backend for quest generation');
      const result = await callApi('transform-task', 'POST', {
        taskTitle,
        category,
        difficulty
      });
      
      console.log('Successfully received quest from backend:', result);
      return {
        questTitle: result.questTitle,
        questNarrative: result.questNarrative,
        isAIGenerated: true
      };
    } else {
      throw new Error('Using local generation based on .env configuration');
    }
  } catch (error) {
    logServerComm('fallback', 'transform-task', null, null, error.message);
    console.log('Falling back to local quest generation due to:', error.message);
    
    return {
      questTitle: fallbackGenerateQuestTitle(taskTitle, category),
      questNarrative: fallbackGenerateQuestNarrative(taskTitle, category, difficulty),
      isAIGenerated: false
    };
  }
};

/**
 * Generate a motivational message for the user
 * @returns {Promise<string>} - The generated motivational message
 */
export const generateMotivationalMessage = async () => {
  try {
    console.log(`generateMotivationalMessage called, USE_BACKEND_GENERATION=${USE_BACKEND_GENERATION}`);
    
    if (USE_BACKEND_GENERATION) {
      console.log('Attempting to use backend for motivational message');
      
      // Add a random query parameter to force a new API call each time
      const uniqueEndpoint = `motivational-message?random=${Math.random()}`;
      const result = await callApi(uniqueEndpoint, 'GET');
      console.log('Successfully received message from backend:', result);
      
      // Handle both response formats - direct and nested in data property
      if (result && result.motivationalMessage) {
        return result.motivationalMessage;
      }
      else if (result && typeof result === 'object') {
        return result.motivationalMessage || result.message || 
               (result.data && result.data.motivationalMessage) || 
               "Your adventure awaits, brave hero!";
      }
      return result;
    } else {
      throw new Error('Using local generation based on .env configuration');
    }
  } catch (error) {
    logServerComm('fallback', 'motivational-message', null, null, error.message);
    console.log('Falling back to local motivational message generation due to:', error.message);
    return fallbackGenerateMotivationalMessage();
  }
};

/**
 * Generate an achievement badge description
 * @param {string} achievementType - The type of achievement
 * @param {number} milestone - The milestone value
 * @returns {Promise<Object>} - The generated badge data
 */
export const generateAchievementBadge = async (achievementType, milestone) => {
  try {
    console.log(`generateAchievementBadge called: "${achievementType}", USE_BACKEND_GENERATION=${USE_BACKEND_GENERATION}`);
    
    if (USE_BACKEND_GENERATION) {
      console.log('Attempting to use backend for badge generation');
      const payload = {
        achievementType,
        milestone
      };
      
      const result = await callApi('achievement-badge', 'POST', payload);
      console.log('Successfully received badge from backend:', result);
      return {
        ...result,
        isAIGenerated: true
      };
    } else {
      throw new Error('Using local generation based on .env configuration');
    }
  } catch (error) {
    logServerComm('fallback', 'achievement-badge', null, null, error.message);
    console.log('Falling back to local badge generation due to:', error.message);
    const fallbackBadge = fallbackGenerateAchievementBadge(achievementType, milestone);
    return {
      ...fallbackBadge,
      isAIGenerated: false
    };
  }
};

// ======== FALLBACK FUNCTIONS ========
// These functions are used when the backend API is unavailable

/**
 * Fallback function to generate quest titles locally
 */
function fallbackGenerateQuestTitle(taskTitle, category) {
  // Convert category to theme
  let theme = '';
  switch (category.toLowerCase()) {
    case 'work':
      theme = 'Guild';
      break;
    case 'education':
    case 'study':
    case 'learning':
      theme = 'Arcane';
      break;
    case 'fitness':
    case 'health':
      theme = 'Warrior';
      break;
    case 'home':
    case 'chores':
      theme = 'Village';
      break;
    default:
      theme = 'Adventure';
  }
  
  // Simple templates
  const templates = [
    `The ${theme} ${capitalize(taskTitle)}`,
    `${theme} Mission: ${capitalize(taskTitle)}`,
    `${theme}'s Call: ${capitalize(taskTitle)}`,
    `The ${theme} Seeker's ${capitalize(taskTitle)}`,
    `${capitalize(taskTitle)} of the ${theme} Realm`
  ];
  
  // Select a random template
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

/**
 * Fallback function to generate quest narratives locally
 */
function fallbackGenerateQuestNarrative(taskTitle, category, difficulty) {
  // Base narratives by category
  const categoryNarratives = {
    work: 'The Guild requires your expertise. Complete this task to gain favor with the Guild Masters.',
    education: 'Ancient knowledge awaits your discovery. Master this arcane challenge to expand your wisdom.',
    learning: 'Ancient knowledge awaits your discovery. Master this arcane challenge to expand your wisdom.',
    fitness: 'A warrior\'s strength comes from consistent training. Push through this challenge to enhance your power.',
    health: 'A warrior\'s strength comes from consistent training. Push through this challenge to enhance your power.',
    home: 'The village needs your attention. Restore order to this area to improve the prosperity of your domain.',
    chores: 'The village needs your attention. Restore order to this area to improve the prosperity of your domain.',
    personal: 'Your personal quest awaits. Success will bring you closer to fulfilling your destiny.',
  };
  
  // Difficulty modifiers
  const difficultyModifiers = {
    mini: 'This is but a small step in your journey, yet important nonetheless.',
    normal: 'A worthy challenge that will test your resolve and determination.',
    boss: 'Beware, adventurer! This formidable task will require all your skill and courage to overcome.'
  };
  
  // Get base narrative by category or default to personal
  const baseCategory = Object.keys(categoryNarratives).find(
    key => category.toLowerCase().includes(key)
  ) || 'personal';
  
  // Combine with difficulty modifier
  return `${categoryNarratives[baseCategory]} ${difficultyModifiers[difficulty] || difficultyModifiers.normal}`;
}

/**
 * Fallback function to generate motivational messages locally
 */
function fallbackGenerateMotivationalMessage() {
  const messages = [
    "The path to greatness is paved with completed quests!",
    "Even the mightiest heroes began with small victories. Keep going!",
    "Your quest log grows more impressive each day. The kingdom notices your deeds!",
    "The greatest adventure is the one that transforms you. Onward!",
    "A true hero knows that persistence unlocks all achievements.",
    "Your journey inspires others around you. Continue your noble path!",
    "Each completed quest brings you closer to legendary status.",
    "The rewards of consistency are waiting just over the horizon.",
    "Your dedication to your quests shapes your destiny.",
    "Today's small victory is tomorrow's epic tale!"
  ];
  
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

/**
 * Fallback function to generate achievement badges locally
 */
function fallbackGenerateAchievementBadge(achievementType, milestone) {
  // Default badge descriptions
  const defaultBadges = {
    'First Quest': {
      badgeName: 'Brave First Step',
      badgeDescription: 'You completed your first quest and began your adventure!',
      iconType: 'boot'
    },
    'Quest Novice': {
      badgeName: 'Quest Seeker',
      badgeDescription: 'You completed 5 quests and are developing your adventuring skills.',
      iconType: 'scroll'
    },
    'Quest Adept': {
      badgeName: 'Quest Champion',
      badgeDescription: 'With 10 quests completed, your reputation grows throughout the realm.',
      iconType: 'shield'
    },
    'Quest Master': {
      badgeName: 'Quest Legend',
      badgeDescription: 'After 25 quests, bards sing tales of your legendary accomplishments!',
      iconType: 'crown'
    },
    'Consistent Adventurer': {
      badgeName: 'Steadfast Journeyer',
      badgeDescription: 'You maintained focus for 3 days straight. Your persistence is remarkable!',
      iconType: 'calendar'
    },
    'Weekly Warrior': {
      badgeName: 'Hero of the Week',
      badgeDescription: 'A full week of continuous progress! Few adventurers show such dedication.',
      iconType: 'star'
    },
    'Point Collector': {
      badgeName: 'XP Gatherer',
      badgeDescription: 'You\'ve accumulated 100 XP points through your noble deeds.',
      iconType: 'gem'
    },
    'XP Hunter': {
      badgeName: 'XP Virtuoso',
      badgeDescription: 'With 500 XP points, your power in the realm is undeniable!',
      iconType: 'trophy'
    }
  };
  
  // Return the default badge if it exists, otherwise generate a generic one
  if (defaultBadges[achievementType]) {
    return defaultBadges[achievementType];
  }
  
  // Generic badge for unknown types
  return {
    badgeName: `${achievementType} Master`,
    badgeDescription: `You've reached the impressive milestone of ${milestone}!`,
    iconType: 'medal'
  };
}

// Helper function to capitalize first letter
function capitalize(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates a quest title for a task using the AI backend
 * @param {string} taskName - The name of the task to transform
 * @param {string} taskDescription - Optional description of the task
 * @returns {Promise<string>} - The generated quest title
 */
export const generateQuestTitle = async (taskName, taskDescription = "") => {
  if (!USE_BACKEND_GENERATION) {
    const fallbackReason = "Using local generation based on .env configuration";
    logFallbackUsage('quest-title', fallbackReason);
    return `Quest: ${taskName}`;
  }
  
  try {
    const response = await fetch(`${API_URL}/transform-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: taskName,
        description: taskDescription,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.questTitle || `Quest: ${taskName}`;
  } catch (error) {
    console.error("Error generating quest title:", error);
    return `Quest: ${taskName}`;
  }
};

/**
 * Generates a quest narrative for a task using the AI backend
 * @param {string} taskName - The name of the task to transform
 * @param {string} taskDescription - Optional description of the task
 * @returns {Promise<string>} - The generated quest narrative
 */
export const generateQuestNarrative = async (taskName, taskDescription = "") => {
  if (!USE_BACKEND_GENERATION) {
    const fallbackReason = "Using local generation based on .env configuration";
    logFallbackUsage('quest-narrative', fallbackReason);
    return `A brave adventurer must complete ${taskName} to help the kingdom thrive.`;
  }
  
  try {
    const response = await fetch(`${API_URL}/transform-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: taskName,
        description: taskDescription,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.questNarrative || `A brave adventurer must complete ${taskName} to help the kingdom thrive.`;
  } catch (error) {
    console.error("Error generating quest narrative:", error);
    return `A brave adventurer must complete ${taskName} to help the kingdom thrive.`;
  }
};