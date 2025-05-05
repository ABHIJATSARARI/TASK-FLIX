import React, { useContext, useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Animated,
  RefreshControl,
  ImageBackground,
  StatusBar,
  Image
} from 'react-native';
import { Card, Title, Paragraph, Badge, Chip, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { TaskContext } from '../context/TaskContext';
import { generateMotivationalMessage } from '../utils/aiTransformer';
import { 
  fadeIn, 
  staggeredAnimations,
  createPulseAnimation
} from '../utils/animationUtils';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, commonStyles } from '../utils/theme';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Difficulty level icons/colors
const difficultyConfig = {
  mini: { 
    color: COLORS.mini, 
    label: 'Mini Quest',
    icon: '🔰',
    gradientColors: ['#00CBA3', '#00E8BB']
  },
  normal: { 
    color: COLORS.normal, 
    label: 'Quest',
    icon: '⚔️',
    gradientColors: ['#6C5CE7', '#8C7BFE']
  },
  boss: { 
    color: COLORS.boss, 
    label: 'Boss Quest',
    icon: '👑',
    gradientColors: ['#FF3A5E', '#FF6B8B']
  }
};

// Category icons
const categoryIcons = {
  work: '💼',
  personal: '🌟',
  health: '❤️',
  learning: '📚',
  chores: '🧹',
};

// Category icon components with better styling
const getCategoryIcon = (category) => {
  const iconMap = {
    work: 'briefcase',
    personal: 'star-circle',
    health: 'heart-pulse',
    learning: 'book-open-page-variant',
    chores: 'broom',
  };
  
  return iconMap[category.toLowerCase()] || 'star-circle';
};

const HomeScreen = ({ navigation }) => {
  const { tasks, userStats, completeTask, isConnectedToBackend } = useContext(TaskContext);
  const [motivationMessage, setMotivationMessage] = useState('Your quests await, brave adventurer!');
  const [refreshing, setRefreshing] = useState(false);
  const [motivationLoading, setMotivationLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeMotivation = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Pulse animation for connected status
  useEffect(() => {
    if (isConnectedToBackend) {
      createPulseAnimation(pulseAnim);
    }
  }, [isConnectedToBackend]);
  
  // Array of animated values for staggered animations
  const itemAnimations = useRef(
    Array(20).fill(0).map(() => new Animated.Value(0))
  ).current;

  // Load and animate on initial render
  useEffect(() => {
    refreshMotivation();
    
    // Animate screen entrance
    Animated.parallel([
      fadeIn(fadeAnim),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  // Animate list items when tasks change
  useEffect(() => {
    const animations = itemAnimations.map((anim, index) => {
      // Reset animations
      anim.setValue(0);
      
      // Create animation for this item
      return Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true
      });
    });

    // Only animate the number of tasks we have
    staggeredAnimations(
      itemAnimations.slice(0, tasks.length),
      80,
      (anim) => Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      })
    );
  }, [tasks.length]);

  // Generate a new motivational message with animation
  const refreshMotivation = async () => {
    setMotivationLoading(true);
    Animated.timing(fadeMotivation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(async () => {
      try {
        // Import the getApiUrl function from connectionUtils
        const { getApiUrl } = require('../utils/connectionUtils');
        
        // Add a timestamp to ensure we always get a fresh message
        const timestamp = new Date().getTime();
        
        // Get the proper API URL using connectionUtils
        const apiUrl = await getApiUrl(`motivational-message?t=${timestamp}`);
        
        if (apiUrl) {
          // Call the API directly with the discovered URL
          const result = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            // Add timeout to avoid hanging requests
            timeout: 5000
          });
          
          if (result.ok) {
            const data = await result.json();
            const message = data.motivationalMessage || 
                          (data.data && data.data.motivationalMessage) || 
                          "A true hero faces each challenge with courage!";
            setMotivationMessage(message);
          } else {
            // API call was not successful, use the utility function as fallback
            const message = await generateMotivationalMessage();
            setMotivationMessage(message);
          }
        } else {
          // No API URL available, use the utility function
          const message = await generateMotivationalMessage();
          setMotivationMessage(message);
        }
      } catch (error) {
        console.log('Error refreshing motivation:', error);
        // Fallback to the aiTransformer utility function
        try {
          const message = await generateMotivationalMessage();
          setMotivationMessage(message);
        } catch (innerError) {
          // If even that fails, use a hardcoded message
          console.error('Even fallback failed:', innerError);
          setMotivationMessage("The bravest heroes persevere even when faced with challenges!");
        }
      }
      
      Animated.timing(fadeMotivation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start(() => setMotivationLoading(false));
    });
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshMotivation();
    setRefreshing(false);
  };

  // Handle completing a task with animation
  const handleCompleteTask = (id) => {
    // Scale animation on completion
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true
      })
    ]).start();
    
    // Complete the task
    completeTask(id);
  };

  // Filter tasks to show incomplete ones first, then completed ones
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return a.completed ? 1 : -1;
  });

  // Render each quest/task
  const renderQuest = ({ item, index }) => {
    const difficulty = difficultyConfig[item.difficulty] || difficultyConfig.normal;
    const categoryIcon = getCategoryIcon(item.category);
    
    // Get animation for this item
    const animatedStyle = {
      opacity: itemAnimations[index],
      transform: [
        { 
          translateY: itemAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0]
          })
        },
        { scale: itemAnimations[index] }
      ]
    };
    
    return (
      <Animated.View style={animatedStyle}>
        <Card 
          style={[
            styles.questCard, 
            item.completed && styles.completedQuest
          ]} 
          onPress={() => navigation.navigate('QuestDetail', { questId: item.id })}
        >
          <LinearGradient
            colors={item.completed ? ['rgba(240,240,250,0.7)', 'rgba(250,250,255,0.8)'] : ['rgba(250,250,255,0.9)', 'rgba(255,255,255,1)']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Banner with difficulty color */}
            <LinearGradient
              colors={difficulty.gradientColors}
              style={styles.difficultyBanner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.difficultyIcon}>{difficulty.icon}</Text>
              <Text style={styles.difficultyLabel}>{difficulty.label}</Text>
            </LinearGradient>
            
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryContainer}>
                  <View style={styles.categoryChip}>
                    <MaterialCommunityIcons 
                      name={categoryIcon} 
                      size={16} 
                      color={COLORS.primary} 
                    />
                    <Text style={styles.categoryText}>
                      {item.category}
                    </Text>
                  </View>
                </View>
              </View>
              
              <Title style={[
                styles.questTitle,
                item.completed && styles.completedText
              ]}>
                {item.questTitle || `Quest: ${item.title}`}
              </Title>
              
              <Paragraph 
                numberOfLines={2} 
                style={[
                  styles.questDescription,
                  item.completed && styles.completedText
                ]}
              >
                {item.questNarrative || item.description || 'A mysterious quest awaits...'}
              </Paragraph>
              
              {!item.completed ? (
                <TouchableOpacity 
                  style={styles.completeButton}
                  onPress={() => handleCompleteTask(item.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.success, '#00F196']}
                    style={styles.completeButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.completeButtonText}>Complete Quest</Text>
                    <MaterialCommunityIcons name="check-circle" size={18} color="#fff" style={styles.completeIcon} />
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.completedBanner}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} style={{marginRight: 6}} />
                  <Text style={styles.completedBannerText}>Quest Completed</Text>
                </View>
              )}
              
              {item.isAIGenerated && (
                <View style={styles.aiGeneratedBadge}>
                  <MaterialCommunityIcons name="robot" size={14} color={COLORS.textPrimary} />
                </View>
              )}
            </Card.Content>
          </LinearGradient>
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />
      
      {/* Header with stats */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Only show Connected indicator when backend is available */}
        {isConnectedToBackend && (
          <Animated.View style={[
            styles.connectedIndicator,
            { 
              backgroundColor: 'rgba(0, 208, 126, 0.2)',
              transform: [{ scale: pulseAnim }]
            }
          ]}>
            <MaterialCommunityIcons name="connection" size={14} color={COLORS.success} />
            <Text style={styles.connectedText}>
              AI Connected
            </Text>
          </Animated.View>
        )}
        
        <View style={styles.headerContent}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name="star" size={18} color="#FFC048" />
              </View>
              <Text style={styles.statValue}>{userStats.points}</Text>
              <Text style={styles.statLabel}>XP Points</Text>
            </View>
            
            <View style={styles.statContainer}>
              <Animated.View style={[styles.statCircle, { transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.statCircleText}>{userStats.completedQuests}</Text>
                <Text style={styles.statCircleSubText}>Quests</Text>
                <MaterialCommunityIcons name="flag-checkered" size={20} color="rgba(255, 255, 255, 0.9)" style={styles.statIcon} />
              </Animated.View>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name="calendar-check" size={18} color="#00D07E" />
              </View>
              <Text style={styles.statValue}>{userStats.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
          
          {/* Motivational message */}
          <TouchableOpacity 
            onPress={refreshMotivation} 
            style={styles.motivationContainer}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.motivationGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="message-text" size={18} color="rgba(255,255,255,0.9)" style={styles.motivationIcon} />
              {motivationLoading ? (
                <ActivityIndicator color="#fff" size={18} style={{ alignSelf: 'center' }} />
              ) : (
                <Animated.Text style={[styles.motivationText, { opacity: fadeMotivation }]}>
                  "{motivationMessage}"
                </Animated.Text>
              )}
              <IconButton 
                icon="refresh" 
                size={16} 
                color="#fff" 
                style={styles.refreshIcon}
                onPress={refreshMotivation}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Quest List */}
      <Animated.View style={[styles.questListContainer, { opacity: fadeAnim }]}>
        <FlatList
          data={sortedTasks}
          renderItem={renderQuest}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.questList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary, COLORS.secondary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Image 
                source={require('../../assets/logo1.png')} 
                style={styles.emptyStateImage}
                resizeMode="contain"
              />
              <Text style={styles.emptyStateTitle}>Your Adventure Awaits!</Text>
              <Text style={styles.emptyStateText}>Create your first quest to begin your epic journey.</Text>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('AddQuest')}
                style={styles.addButton}
                icon="plus"
                labelStyle={styles.addButtonLabel}
              >
                Create Your First Quest
              </Button>
            </View>
          }
        />
      </Animated.View>

      {/* Floating action button to add new quest */}
      <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity 
          onPress={() => {
            Animated.sequence([
              Animated.spring(fabScale, { toValue: 0.85, useNativeDriver: true }),
              Animated.spring(fabScale, { toValue: 1, friction: 3, useNativeDriver: true })
            ]).start(() => navigation.navigate('AddQuest'));
          }}
          style={styles.fabButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="plus" size={30} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: SPACING.xl + 20,
    paddingBottom: SPACING.lg + 10,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    ...SHADOWS.medium,
  },
  headerContent: {
    paddingHorizontal: SPACING.md,
  },
  connectedIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  connectedText: {
    color: COLORS.success,
    fontSize: FONTS.sizes.caption,
    fontWeight: FONTS.weights.medium,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statContainer: {
    alignItems: 'center',
  },
  statCircle: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...SHADOWS.small,
  },
  statCircleText: {
    fontSize: FONTS.sizes.h1,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textInverse,
    marginBottom: -4,
  },
  statCircleSubText: {
    fontSize: FONTS.sizes.caption,
    fontWeight: FONTS.weights.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statIcon: {
    position: 'absolute',
    bottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  statValue: {
    fontSize: FONTS.sizes.h3,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textInverse,
  },
  statLabel: {
    fontSize: FONTS.sizes.caption,
    fontWeight: FONTS.weights.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  motivationContainer: {
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  motivationGradient: {
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  motivationIcon: {
    marginRight: 8,
  },
  motivationText: {
    color: COLORS.textInverse,
    fontStyle: 'italic',
    textAlign: 'center',
    flex: 1,
    fontSize: FONTS.sizes.body2,
  },
  refreshIcon: {
    margin: 0,
    padding: 0,
  },
  questListContainer: {
    flex: 1,
  },
  questList: {
    padding: SPACING.md,
    paddingBottom: 100, // Extra padding at bottom for FAB
  },
  questCard: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    ...SHADOWS.medium,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.1)',
  },
  cardGradient: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  cardContent: {
    paddingTop: SPACING.lg + 10, // Extra space for badge
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  difficultyBanner: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  difficultyLabel: {
    color: COLORS.textInverse,
    fontWeight: FONTS.weights.medium,
    fontSize: FONTS.sizes.body2,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
  },
  categoryText: {
    fontSize: FONTS.sizes.caption,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
    marginLeft: 4,
  },
  questTitle: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    fontSize: FONTS.sizes.h4,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  questDescription: {
    marginBottom: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.body2,
    lineHeight: 20,
  },
  completedQuest: {
    borderColor: 'rgba(0, 208, 126, 0.2)',
  },
  completedText: {
    color: COLORS.textDisabled,
  },
  completeButton: {
    borderRadius: RADIUS.round,
    overflow: 'hidden',
    ...SHADOWS.small,
    marginTop: SPACING.xs,
  },
  completeButtonGradient: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.round,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    color: COLORS.textInverse,
    fontWeight: FONTS.weights.medium,
    fontSize: FONTS.sizes.body2,
  },
  completeIcon: {
    marginLeft: 8,
  },
  completedBanner: {
    backgroundColor: 'rgba(0, 208, 126, 0.1)',
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  completedBannerText: {
    color: COLORS.success,
    fontWeight: FONTS.weights.medium,
    fontSize: FONTS.sizes.body2,
  },
  aiGeneratedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.accent,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.lg + 5,
    right: SPACING.lg,
    ...SHADOWS.large,
    elevation: 8,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  fabText: {
    fontSize: 30,
    color: COLORS.textInverse,
    fontWeight: FONTS.weights.bold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    marginTop: SPACING.xl,
  },
  emptyStateImage: {
    width: 200,
    height: 200,
    marginBottom: SPACING.lg,
  },
  emptyStateTitle: {
    fontSize: FONTS.sizes.h2,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: FONTS.sizes.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    maxWidth: '80%',
  },
  addButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    elevation: 4,
  },
  addButtonLabel: {
    fontWeight: FONTS.weights.medium,
    fontSize: FONTS.sizes.body2,
  },
});

export default HomeScreen;