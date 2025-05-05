import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Badge, Divider, ActivityIndicator } from 'react-native-paper';
import { TaskContext } from '../context/TaskContext';
import { generateMotivationalMessage } from '../utils/aiTransformer';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../utils/theme';
import { fadeIn, createBounceAnimation, createShineAnimation } from '../utils/animationUtils';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Difficulty level configurations with icons
const difficultyConfig = {
  mini: { 
    color: COLORS.mini, 
    label: 'Mini Quest', 
    points: 10,
    icon: 'flag-outline'
  },
  normal: { 
    color: COLORS.normal, 
    label: 'Quest', 
    points: 25,
    icon: 'flag-checkered'
  },
  boss: { 
    color: COLORS.boss, 
    label: 'Boss Quest', 
    points: 50,
    icon: 'crown'
  }
};

const QuestDetailScreen = ({ route, navigation }) => {
  const { questId } = route.params;
  const { tasks, completeTask, deleteTask } = useContext(TaskContext);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;
  
  // Find the current task/quest
  const task = tasks.find(t => t.id === questId);

  // Load motivational message and start animations
  useEffect(() => {
    // Start fade and scale animations
    Animated.parallel([
      fadeIn(fadeAnim),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    
    // For completed quests, show shine animation
    if (task?.completed) {
      createShineAnimation(shineAnim).start();
    }
    
    // Generate motivational message
    const loadMotivationalMessage = async () => {
      setIsLoading(true);
      try {
        const message = await generateMotivationalMessage();
        setMotivationalMessage(message);
      } catch (error) {
        console.error('Error loading motivational message:', error);
        setMotivationalMessage('Your destiny awaits, brave hero!');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMotivationalMessage();
  }, [task]);

  // If task not found
  if (!task) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Quest not found!</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  const difficulty = difficultyConfig[task.difficulty] || difficultyConfig.normal;
  const categoryColor = COLORS[task.category] || COLORS.personal;

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  // Calculate days ago
  const getDaysAgo = (dateString) => {
    const today = new Date();
    const createdDate = new Date(dateString);
    const diffTime = Math.abs(today - createdDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Animated.View 
        style={[
          styles.animatedContainer,
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Card style={[
          styles.card,
          task.completed && styles.completedCard
        ]}>
          {/* Quest Banner */}
          <View style={[styles.banner, { backgroundColor: difficulty.color }]}>
            <MaterialCommunityIcons name={difficulty.icon} size={24} color="white" />
            <Text style={styles.bannerText}>{difficulty.label} • {difficulty.points} XP</Text>
          </View>

          <Card.Content>
            {/* Category and Status */}
            <View style={styles.headerRow}>
              <Chip 
                style={{ backgroundColor: categoryColor }} 
                textStyle={{ color: 'white' }}
              >
                {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
              </Chip>
              
              {task.completed ? (
                <Chip 
                  icon="check-circle" 
                  style={styles.completedChip}
                >
                  Completed
                </Chip>
              ) : (
                <Chip 
                  icon="clock-outline"
                  style={styles.pendingChip}
                >
                  In Progress
                </Chip>
              )}
            </View>
            
            {/* Quest title with shine effect if completed */}
            <Animated.View
              style={task.completed ? {
                transform: [{
                  translateX: shineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 300]
                  })
                }]
              } : null}
            >
              <Title style={styles.questTitle}>{task.questTitle || task.title}</Title>
              
              {/* Shine overlay if completed */}
              {task.completed && (
                <Animated.View 
                  style={[
                    styles.shineEffect,
                    {
                      transform: [{
                        translateX: shineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-100, 300]
                        })
                      }]
                    }
                  ]}
                />
              )}
            </Animated.View>
            
            {/* Real task name if different from quest title */}
            {task.questTitle && task.questTitle !== task.title && (
              <Paragraph style={styles.realTaskName}>(Task: {task.title})</Paragraph>
            )}
            
            {/* Quest narrative */}
            <View style={styles.narrativeContainer}>
              <View style={styles.narrativeIcon}>
                <MaterialCommunityIcons name="book-open-page-variant" size={24} color={COLORS.primary} />
              </View>
              <Paragraph style={styles.narrativeText}>
                {task.questNarrative || 'A mysterious quest awaits you...'}
              </Paragraph>
            </View>
            
            <Divider style={styles.divider} />
            
            {/* Task details */}
            {task.description && (
              <View>
                <Text style={styles.sectionTitle}>Details:</Text>
                <Paragraph style={styles.description}>{task.description}</Paragraph>
              </View>
            )}
            
            <View style={styles.dateContainer}>
              <MaterialCommunityIcons name="calendar-plus" size={18} color="#666" />
              <Text style={styles.dateText}>
                Created: {formatDate(task.createdAt)}
              </Text>
            </View>
            
            <View style={styles.daysContainer}>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#666" />
              <Text style={styles.dateText}>
                {getDaysAgo(task.createdAt)}
              </Text>
            </View>
            
            {task.completed && task.completedAt && (
              <View style={styles.dateContainer}>
                <MaterialCommunityIcons name="calendar-check" size={18} color={COLORS.mini} />
                <Text style={[styles.dateText, { color: COLORS.mini }]}>
                  Completed: {formatDate(task.completedAt)}
                </Text>
              </View>
            )}
            
            {/* Motivational message */}
            <View style={styles.motivationContainer}>
              {isLoading ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <View style={{flexDirection: 'row'}}>
                  <MaterialCommunityIcons name="message-text" size={20} color={COLORS.primary} style={styles.motivationIcon} />
                  <Text style={styles.motivationalMessage}>{motivationalMessage}</Text>
                </View>
              )}
            </View>
            
            {/* Action buttons */}
            <View style={styles.buttonsContainer}>
              {!task.completed ? (
                <TouchableOpacity
                  style={styles.actionButtonContainer}
                  onPress={() => {
                    // Create animation when completing
                    Animated.sequence([
                      createBounceAnimation(scaleAnim),
                      Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                      })
                    ]).start(() => {
                      completeTask(task.id);
                      navigation.goBack();
                    });
                  }}
                >
                  <Button 
                    mode="contained" 
                    icon="check"
                    style={[styles.actionButton, { backgroundColor: COLORS.mini }]}
                  >
                    Complete Quest
                  </Button>
                </TouchableOpacity>
              ) : (
                <View style={styles.completedContainer}>
                  <Badge size={24} style={styles.completedBadge}>✓</Badge>
                  <Text style={styles.completedText}>Quest Completed!</Text>
                </View>
              )}
              
              <Button 
                mode="outlined" 
                icon="close"
                style={styles.actionButton}
                onPress={() => {
                  Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }).start(() => {
                    deleteTask(task.id);
                    navigation.goBack();
                  });
                }}
              >
                Abandon Quest
              </Button>
              
              <Button 
                mode="text" 
                icon="arrow-left"
                onPress={() => navigation.goBack()}
              >
                Back to Quests
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  animatedContainer: {
    width: '100%',
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
  },
  completedCard: {
    borderColor: COLORS.mini,
    borderWidth: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
  },
  bannerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  questTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.primaryDark,
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: 60,
    transform: [{ skewX: '-20deg' }],
  },
  realTaskName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  narrativeContainer: {
    backgroundColor: '#f8f4ff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  narrativeIcon: {
    marginRight: 12,
    alignSelf: 'flex-start',
  },
  narrativeText: {
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  divider: {
    marginVertical: 16,
    height: 1.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.primary,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  motivationContainer: {
    flexDirection: 'row',
    backgroundColor: '#fffde7',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  motivationIcon: {
    marginRight: 12,
  },
  motivationalMessage: {
    fontStyle: 'italic',
    flex: 1,
    fontSize: 16,
  },
  buttonsContainer: {
    alignItems: 'center',
  },
  actionButtonContainer: {
    width: '100%',
  },
  actionButton: {
    marginBottom: 12,
    width: '100%',
    height: 48,
    justifyContent: 'center',
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  completedBadge: {
    backgroundColor: COLORS.mini,
    marginRight: 8,
  },
  completedText: {
    fontSize: 16,
    color: COLORS.mini,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    textAlign: 'center',
    marginVertical: 24,
  },
  completedChip: {
    backgroundColor: COLORS.mini,
  },
  pendingChip: {
    backgroundColor: '#ffd54f',
  },
  backButton: {
    marginTop: 16,
    alignSelf: 'center',
  }
});

export default QuestDetailScreen;