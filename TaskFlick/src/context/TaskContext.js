import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateQuestTitle, generateQuestNarrative, generateAchievementBadge } from '../utils/aiTransformer';
import { v4 as uuidv4 } from 'uuid';
import { Alert } from 'react-native';

// Create the Task Context
export const TaskContext = createContext();

// API URL - Update with your actual backend URL when deployed
const API_URL = 'http://localhost:3000/api';

// Task Provider Component
export const TaskProvider = ({ children }) => {
  // State for tasks and user stats
  const [tasks, setTasks] = useState([]);
  const [userStats, setUserStats] = useState({
    points: 0,
    completedQuests: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    badges: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectedToBackend, setIsConnectedToBackend] = useState(false);
  const [resetOnStartup, setResetOnStartup] = useState(true); // Add state for tracking reset preference

  // Check backend connection and reset data on mount
  useEffect(() => {
    const initialize = async () => {
      await checkBackendConnection();
      
      // Check if we should reset data on startup
      const shouldReset = await AsyncStorage.getItem('resetOnStartup');
      
      if (shouldReset !== 'false') {
        console.log("Resetting all data on app startup");
        await clearAllData();
        // Reset session on backend if connected
        if (isConnectedToBackend) {
          try {
            await fetch(`${API_URL}/reset-session`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            console.log("Backend session reset successfully");
          } catch (error) {
            console.error("Failed to reset backend session:", error);
          }
        }
      } else {
        await loadData();
      }
      
      setIsLoading(false);
    };
    
    initialize();
  }, []);

  // Save data whenever tasks or userStats change
  useEffect(() => {
    if (!isLoading) {
      saveData();
    }
  }, [tasks, userStats]);

  // Check if backend is available
  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/health`, { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        console.log("Backend connection established!");
        setIsConnectedToBackend(true);
        return true;
      } else {
        console.log("Backend server is available but returned an error");
        setIsConnectedToBackend(false);
        return false;
      }
    } catch (error) {
      console.log("Could not connect to backend:", error);
      setIsConnectedToBackend(false);
      return false;
    }
  };

  // Load data from AsyncStorage
  const loadData = async () => {
    try {
      const tasksData = await AsyncStorage.getItem('tasks');
      const userStatsData = await AsyncStorage.getItem('userStats');
      
      if (tasksData) {
        setTasks(JSON.parse(tasksData));
      }
      
      if (userStatsData) {
        setUserStats(JSON.parse(userStatsData));
      }
    } catch (error) {
      console.error('Error loading data from AsyncStorage:', error);
    }
  };

  // Save data to AsyncStorage
  const saveData = async () => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
      await AsyncStorage.setItem('userStats', JSON.stringify(userStats));
    } catch (error) {
      console.error('Error saving data to AsyncStorage:', error);
    }
  };

  // Toggle reset on startup preference
  const toggleResetOnStartup = async (value) => {
    try {
      setResetOnStartup(value);
      await AsyncStorage.setItem('resetOnStartup', value ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving reset preference:', error);
    }
  };

  // Add a new task
  const addTask = async (taskData, navigation) => {
    try {
      const now = new Date();
      
      // Create basic task with required fields
      const newTask = {
        id: uuidv4(),
        title: taskData.title,
        description: taskData.description || '',
        category: taskData.category || 'personal',
        difficulty: taskData.difficulty || 'normal',
        completed: false,
        createdAt: now.toISOString(),
      };
      
      // Generate quest title and narrative using AI
      try {
        // Try to use the backend if connected
        if (isConnectedToBackend) {
          try {
            console.log('Using backend API for quest generation');
            const response = await fetch(`${API_URL}/transform-task`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                taskTitle: taskData.title,
                category: taskData.category,
                difficulty: taskData.difficulty
              }),
            });
            
            if (!response.ok) {
              throw new Error(`API request failed with status ${response.status}`);
            }
            
            const questData = await response.json();
            console.log('Received quest data:', JSON.stringify(questData));
            
            // Apply the quest data to the task
            if (questData && questData.questTitle && questData.questNarrative) {
              newTask.questTitle = questData.questTitle;
              newTask.questNarrative = questData.questNarrative;
              newTask.isAIGenerated = true;
            } else if (questData && questData.data && questData.data.questTitle && questData.data.questNarrative) {
              // Handle nested data structure
              newTask.questTitle = questData.data.questTitle;
              newTask.questNarrative = questData.data.questNarrative;
              newTask.isAIGenerated = true;
            } else {
              console.error('Incomplete quest data received:', questData);
              throw new Error('Incomplete quest data received');
            }
          } catch (error) {
            console.error('Backend API error:', error);
            throw error; // Let the outer catch block handle it
          }
        } else {
          // Use local generation if backend not available
          newTask.questTitle = await generateQuestTitle(taskData.title, taskData.category);
          newTask.questNarrative = await generateQuestNarrative(taskData.title, taskData.category, taskData.difficulty);
          newTask.isAIGenerated = false;
        }
      } catch (error) {
        console.error('Error generating quest content:', error);
        // Fallback to title as quest title if AI generation fails
        newTask.questTitle = `Quest: ${taskData.title}`;
        newTask.questNarrative = 'A mysterious quest awaits your completion...';
        newTask.isAIGenerated = false;
      }
      
      // Update state with new task
      setTasks(prevTasks => [newTask, ...prevTasks]);
      
      // Navigate to home screen after creating quest
      if (navigation) {
        navigation.navigate('Home');
      }
      
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to create quest. Please try again.');
      throw error;
    }
  };
  
  // Mark a task as completed
  const completeTask = async (taskId) => {
    try {
      const now = new Date();
      let updatedTasks = [...tasks];
      let updatedStats = { ...userStats };
      
      // Find task to complete
      const taskIndex = updatedTasks.findIndex(task => task.id === taskId);
      
      if (taskIndex !== -1 && !updatedTasks[taskIndex].completed) {
        // Mark task as completed
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          completed: true,
          completedAt: now.toISOString()
        };
        
        // Update stats
        const task = updatedTasks[taskIndex];
        
        // Calculate points based on difficulty
        let pointsEarned = 0;
        switch (task.difficulty) {
          case 'mini': 
            pointsEarned = 10;
            break;
          case 'boss': 
            pointsEarned = 50;
            break;
          default: // normal
            pointsEarned = 25;
        }
        
        // Update points and completed quests count
        updatedStats.points += pointsEarned;
        updatedStats.completedQuests += 1;
        
        // Update streak
        const lastCompletedDate = updatedStats.lastCompletedDate 
          ? new Date(updatedStats.lastCompletedDate) 
          : null;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastCompletedDate) {
          const lastDate = new Date(lastCompletedDate);
          lastDate.setHours(0, 0, 0, 0);
          
          if (lastDate.getTime() === yesterday.getTime() || lastDate.getTime() === today.getTime()) {
            // Increment streak if completed yesterday or already completed today
            updatedStats.currentStreak += 1;
          } else if (lastDate.getTime() < yesterday.getTime()) {
            // Reset streak if more than a day has passed
            updatedStats.currentStreak = 1;
          }
          // If already completed today, the streak doesn't change
        } else {
          // First completion ever
          updatedStats.currentStreak = 1;
        }
        
        // Update longest streak if current streak is longer
        if (updatedStats.currentStreak > updatedStats.longestStreak) {
          updatedStats.longestStreak = updatedStats.currentStreak;
        }
        
        // Update last completed date
        updatedStats.lastCompletedDate = now.toISOString();
        
        // Check for and add achievements/badges
        await checkAndAddAchievements(updatedStats);
        
        // Update state
        setTasks(updatedTasks);
        setUserStats(updatedStats);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  };

  // Delete a task
  const deleteTask = (taskId) => {
    try {
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  // Check for new achievements and add badges
  const checkAndAddAchievements = async (stats) => {
    const updatedStats = { ...stats };
    const existingBadges = new Set(updatedStats.badges);
    
    try {
      // Achievement: Completed first quest
      if (stats.completedQuests === 1 && !existingBadges.has('First Quest')) {
        existingBadges.add('First Quest');
      }
      
      // Achievement: Reached 5 quests
      if (stats.completedQuests === 5 && !existingBadges.has('Quest Novice')) {
        existingBadges.add('Quest Novice');
      }
      
      // Achievement: Reached 10 quests
      if (stats.completedQuests === 10 && !existingBadges.has('Quest Adept')) {
        existingBadges.add('Quest Adept');
      }
      
      // Achievement: Reached 25 quests
      if (stats.completedQuests === 25 && !existingBadges.has('Quest Master')) {
        existingBadges.add('Quest Master');
      }
      
      // Achievement: 3 day streak
      if (stats.currentStreak === 3 && !existingBadges.has('Consistent Adventurer')) {
        existingBadges.add('Consistent Adventurer');
      }
      
      // Achievement: 7 day streak
      if (stats.currentStreak === 7 && !existingBadges.has('Weekly Warrior')) {
        existingBadges.add('Weekly Warrior');
      }
      
      // Achievement: Reach 100 points
      if (stats.points >= 100 && !existingBadges.has('Point Collector')) {
        existingBadges.add('Point Collector');
      }
      
      // Achievement: Reach 500 points
      if (stats.points >= 500 && !existingBadges.has('XP Hunter')) {
        existingBadges.add('XP Hunter');
      }
      
      // If we added new badges, try to get custom achievement badges from AI backend
      const newBadges = Array.from(existingBadges).filter(badge => !updatedStats.badges.includes(badge));
      
      if (newBadges.length > 0 && isConnectedToBackend) {
        try {
          // For each new badge, try to get a custom description from the backend
          for (const badge of newBadges) {
            const badgeResponse = await fetch(`${API_URL}/achievement-badge`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                achievementType: badge,
                milestone: getAchievementMilestone(badge, stats)
              }),
            });
            
            if (badgeResponse.ok) {
              const badgeData = await badgeResponse.json();
              console.log(`New achievement unlocked: ${badgeData.badgeName} - ${badgeData.badgeDescription}`);
              // Display notification here if desired
            }
          }
        } catch (error) {
          console.error('Error getting achievement badge data:', error);
        }
      }
      
      updatedStats.badges = Array.from(existingBadges);
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
    
    return updatedStats;
  };
  
  // Helper to get milestone value for achievement badges
  const getAchievementMilestone = (badge, stats) => {
    switch (badge) {
      case 'First Quest': return 1;
      case 'Quest Novice': return 5;
      case 'Quest Adept': return 10;
      case 'Quest Master': return 25;
      case 'Consistent Adventurer': return 3;
      case 'Weekly Warrior': return 7;
      case 'Point Collector': return 100;
      case 'XP Hunter': return 500;
      default: return stats.completedQuests;
    }
  };

  // Clear all data (for testing)
  const clearAllData = async () => {
    try {
      await AsyncStorage.removeItem('tasks');
      await AsyncStorage.removeItem('userStats');
      // Don't remove resetOnStartup preference
      
      setTasks([]);
      setUserStats({
        points: 0,
        completedQuests: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        badges: []
      });
      
      console.log('All data cleared');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  };

  return (
    <TaskContext.Provider 
      value={{
        tasks,
        userStats,
        isLoading,
        isConnectedToBackend,
        resetOnStartup,
        addTask,
        completeTask,
        deleteTask,
        clearAllData,
        toggleResetOnStartup
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};