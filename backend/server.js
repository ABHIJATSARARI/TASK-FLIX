const express = require('express');
const cors = require('cors');
const { transformTaskToQuest, generateMotivationalMessage, generateAchievementBadge } = require('./services/graniteService');
const { resetTokenCache } = require('./services/authService');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

// Reset session data on server start
console.log('Server starting - resetting session data');
resetTokenCache();

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// Add health check endpoint at the beginning of your routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TaskFlick backend server is running',
    version: '1.0.0',
    endpoints: [
      { path: '/api/transform-task', method: 'POST', description: 'Transforms a task into a quest' },
      { path: '/api/motivational-message', method: 'GET', description: 'Generates a motivational message' },
      { path: '/api/achievement-badge', method: 'POST', description: 'Generates an achievement badge' },
      { path: '/api/health', method: 'GET', description: 'Health check endpoint' }
    ]
  });
});

app.get('/', (req, res) => {
  res.send('TaskFlick API is running');
});

// Transform task to quest
app.post('/api/transform-task', async (req, res) => {
  try {
    const { task, description, taskTitle, category, difficulty } = req.body;
    
    // Support both parameter formats (new frontend and old backend)
    const taskName = task || taskTitle || '';
    const taskDescription = description || '';
    const taskCategory = category || 'general';
    const taskDifficulty = difficulty || 'medium';
    
    if (!taskName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: task or taskTitle' 
      });
    }
    
    const quest = await transformTaskToQuest(taskName, taskCategory, taskDifficulty, taskDescription);
    
    // Return data in a format the frontend expects
    res.json({ 
      success: true, 
      questTitle: quest.questTitle, 
      questNarrative: quest.questNarrative 
    });
  } catch (error) {
    console.error('Error in transform-task endpoint:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate motivational message
app.get('/api/motivational-message', async (req, res) => {
  try {
    const message = await generateMotivationalMessage();
    // Return in a consistent format that the frontend expects
    res.json({ 
      success: true, 
      motivationalMessage: message 
    });
  } catch (error) {
    console.error('Error in motivational-message endpoint:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate achievement badge
app.post('/api/achievement-badge', async (req, res) => {
  try {
    const { achievementType, milestone } = req.body;
    
    if (!achievementType || !milestone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: achievementType or milestone' 
      });
    }
    
    const badge = await generateAchievementBadge(achievementType, milestone);
    res.json({ 
      success: true,
      badgeName: badge.badgeName,
      badgeDescription: badge.badgeDescription
    });
  } catch (error) {
    console.error('Error in achievement-badge endpoint:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset session data endpoint
app.post('/api/reset-session', (req, res) => {
  try {
    const result = resetTokenCache();
    res.json(result);
  } catch (error) {
    console.error('Error resetting session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`For local access: http://localhost:${PORT}`);
  console.log(`For network access: http://<your-local-ip>:${PORT}`);
});