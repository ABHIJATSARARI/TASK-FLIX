import React, { useContext, useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, Animated } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Badge, Divider, Avatar } from 'react-native-paper';
import { TaskContext } from '../context/TaskContext';
import { generateAchievementBadge } from '../utils/aiTransformer';

// Mock achievements - in a real app, these would be stored in a database
const achievementDefinitions = [
  { id: 'first_quest', name: 'First Steps', description: 'Completed your first quest', icon: '🌱', requirement: 1 },
  { id: 'quest_master', name: 'Quest Master', description: 'Completed 10 quests', icon: '⚔️', requirement: 10 },
  { id: 'legend', name: 'Living Legend', description: 'Completed 25 quests', icon: '👑', requirement: 25 },
  { id: 'streak_3', name: 'Consistent Hero', description: 'Maintained a 3-day streak', icon: '🔥', requirement: 3 },
  { id: 'streak_7', name: 'Weekly Warrior', description: 'Maintained a 7-day streak', icon: '🌟', requirement: 7 },
  { id: 'boss_slayer', name: 'Boss Slayer', description: 'Completed 5 boss quests', icon: '🐉', requirement: 5 },
];

// Level calculation
const calculateLevel = (points) => {
  return Math.floor(Math.sqrt(points / 10)) + 1;
};

// Get next level requirement
const getNextLevelPoints = (level) => {
  return (level * level) * 10;
};

const StatsScreen = ({ navigation }) => {
  const { tasks, userStats } = useContext(TaskContext);
  const [achievements, setAchievements] = useState([]);
  const [progressAnim] = useState(new Animated.Value(0));
  
  // Calculate the current level and progress to next level
  const currentLevel = calculateLevel(userStats.points);
  const pointsForCurrentLevel = getNextLevelPoints(currentLevel - 1);
  const pointsForNextLevel = getNextLevelPoints(currentLevel);
  const pointsNeededForNextLevel = pointsForNextLevel - pointsForCurrentLevel;
  const currentLevelProgress = ((userStats.points - pointsForCurrentLevel) / pointsNeededForNextLevel) * 100;
  
  // Calculate category breakdown - how many tasks completed in each category
  const categoryBreakdown = tasks.reduce((acc, task) => {
    if (task.completed) {
      acc[task.category] = (acc[task.category] || 0) + 1;
    }
    return acc;
  }, {});
  
  // Calculate difficulty breakdown - how many tasks completed in each difficulty
  const difficultyBreakdown = tasks.reduce((acc, task) => {
    if (task.completed) {
      acc[task.difficulty] = (acc[task.difficulty] || 0) + 1;
    }
    return acc;
  }, {});
  
  // Calculate completion rate - completed tasks / total tasks
  const completionRate = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
    : 0;
  
  // Initialize achievements
  useEffect(() => {
    const initAchievements = async () => {
      // Calculate which achievements are earned
      const earnedAchievements = achievementDefinitions.map(achievement => {
        let earned = false;
        let progress = 0;
        
        switch (achievement.id) {
          case 'first_quest':
            progress = userStats.completedQuests;
            earned = userStats.completedQuests >= achievement.requirement;
            break;
          case 'quest_master':
          case 'legend':
            progress = userStats.completedQuests;
            earned = userStats.completedQuests >= achievement.requirement;
            break;
          case 'streak_3':
          case 'streak_7':
            progress = userStats.bestStreak;
            earned = userStats.bestStreak >= achievement.requirement;
            break;
          case 'boss_slayer':
            progress = tasks.filter(t => t.completed && t.difficulty === 'boss').length;
            earned = progress >= achievement.requirement;
            break;
        }
        
        return {
          ...achievement,
          earned,
          progress: Math.min(progress, achievement.requirement),
        };
      });
      
      setAchievements(earnedAchievements);
    };
    
    initAchievements();
  }, [tasks, userStats]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentLevelProgress,
      duration: 800,
      useNativeDriver: false
    }).start();
  }, [currentLevelProgress]);
  
  return (
    <ScrollView style={styles.container}>
      {/* Hero stats card */}
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.avatarContainer}>
            <Avatar.Text 
              size={80} 
              label={`Lv${currentLevel}`} 
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
          </View>
          <View style={styles.heroInfo}>
            <Title style={styles.heroName}>Level {currentLevel} Adventurer</Title>
            <Paragraph style={styles.heroTitle}>
              {currentLevel < 5 ? 'Novice Quester' : 
               currentLevel < 10 ? 'Skilled Adventurer' :
               currentLevel < 15 ? 'Hero of the Realm' : 'Legendary Champion'}
            </Paragraph>
          </View>
        </View>
        
        <Card.Content>
          {/* Level progress bar */}
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>
              Level Progress: {userStats.points - pointsForCurrentLevel}/{pointsNeededForNextLevel} XP
            </Text>
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  { width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%']
                    }) }
                ]}
              />
            </View>
            <Text style={styles.nextLevelText}>
              Next level at {pointsForNextLevel} XP
            </Text>
          </View>
          
          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.points}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.completedQuests}</Text>
              <Text style={styles.statLabel}>Quests Done</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.currentStreak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.bestStreak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {/* Achievements section */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Achievements</Title>
          <Divider style={styles.divider} />
          
          <View style={styles.achievementsContainer}>
            {achievements.map(achievement => (
              <View key={achievement.id} style={styles.achievementItem}>
                <View 
                  style={[
                    styles.achievementIconContainer, 
                    achievement.earned ? styles.achievementEarned : styles.achievementLocked
                  ]}
                >
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                </View>
                <View style={styles.achievementContent}>
                  <View style={styles.achievementHeader}>
                    <Text style={styles.achievementName}>{achievement.name}</Text>
                    {achievement.earned && (
                      <Badge style={styles.earnedBadge}>Earned!</Badge>
                    )}
                  </View>
                  <Text style={styles.achievementDesc}>{achievement.description}</Text>
                  <View style={styles.achievementProgressContainer}>
                    <View 
                      style={[
                        styles.achievementProgressBar,
                        { width: `${(achievement.progress / achievement.requirement) * 100}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.achievementProgressText}>
                    {achievement.progress}/{achievement.requirement}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
      
      {/* Statistics section */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Quest Statistics</Title>
          <Divider style={styles.divider} />
          
          {/* Completion rate */}
          <View style={styles.statSection}>
            <Text style={styles.statSectionTitle}>Quest Completion Rate</Text>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.completionBar, 
                  { width: `${completionRate}%` }
                ]}
              />
            </View>
            <Text style={styles.completionText}>{completionRate}%</Text>
          </View>
          
          {/* Category breakdown */}
          <View style={styles.statSection}>
            <Text style={styles.statSectionTitle}>Quests by Category</Text>
            <View style={styles.breakdownContainer}>
              {Object.entries(categoryBreakdown).map(([category, count]) => (
                <View key={category} style={styles.breakdownItem}>
                  <View style={styles.breakdownLabel}>
                    <Text style={styles.breakdownIcon}>
                      {category === 'work' ? '💼' :
                       category === 'personal' ? '🌟' :
                       category === 'health' ? '❤️' :
                       category === 'learning' ? '📚' :
                       category === 'chores' ? '🧹' : '📋'}
                    </Text>
                    <Text style={styles.breakdownText}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.breakdownValue}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Difficulty breakdown */}
          <View style={styles.statSection}>
            <Text style={styles.statSectionTitle}>Quests by Difficulty</Text>
            <View style={styles.breakdownContainer}>
              {Object.entries(difficultyBreakdown).map(([difficulty, count]) => (
                <View key={difficulty} style={styles.breakdownItem}>
                  <View style={styles.breakdownLabel}>
                    <Text style={styles.breakdownIcon}>
                      {difficulty === 'mini' ? '🔰' :
                       difficulty === 'normal' ? '⚔️' :
                       difficulty === 'boss' ? '👑' : '📋'}
                    </Text>
                    <Text style={styles.breakdownText}>
                      {difficulty === 'mini' ? 'Mini Quest' :
                       difficulty === 'normal' ? 'Normal Quest' :
                       difficulty === 'boss' ? 'Boss Quest' : difficulty}
                    </Text>
                  </View>
                  <Text style={styles.breakdownValue}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {/* Challenge yourself button */}
      <View style={styles.challengeContainer}>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('AddQuest')}
          style={styles.challengeButton}
          accessibilityLabel="Begin a new quest"
        >
          Begin a New Quest!
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  heroCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#6200ee',
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    padding: 8,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatar: {
    backgroundColor: '#6200ee',
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarLabel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  heroInfo: {
    marginLeft: 16,
  },
  heroName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
  },
  heroTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  levelContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  levelText: {
    color: 'white',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
  },
  nextLevelText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 80,
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  sectionCard: {
    margin: 16,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  divider: {
    marginTop: 8,
    marginBottom: 16,
  },
  achievementsContainer: {
    marginBottom: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  achievementIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementEarned: {
    backgroundColor: '#6200ee',
  },
  achievementLocked: {
    backgroundColor: '#e0e0e0',
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementContent: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  earnedBadge: {
    backgroundColor: '#4CAF50',
    color: 'white',
    fontSize: 10,
  },
  achievementDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  achievementProgressContainer: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  achievementProgressBar: {
    height: '100%',
    backgroundColor: '#6200ee',
  },
  achievementProgressText: {
    fontSize: 12,
    color: '#888',
  },
  statSection: {
    marginBottom: 24,
  },
  statSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#6200ee',
  },
  completionBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  completionText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  breakdownContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  breakdownText: {
    fontSize: 14,
    color: '#333',
  },
  breakdownValue: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#6200ee',
  },
  challengeContainer: {
    padding: 16,
    marginBottom: 16,
  },
  challengeButton: {
    paddingVertical: 8,
    borderRadius: 25,
  },
});

export default StatsScreen;