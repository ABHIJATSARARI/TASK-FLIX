import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, IconButton } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { TaskProvider } from './src/context/TaskContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import AddQuestScreen from './src/screens/AddQuestScreen';
import QuestDetailScreen from './src/screens/QuestDetailScreen';
import StatsScreen from './src/screens/StatsScreen';

// Import theme
import { paperTheme, COLORS, SHADOWS, RADIUS } from './src/utils/theme';

// Create navigation stacks and tabs
const QuestStack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Logo component for header
const LogoTitle = () => {
  return (
    <View style={styles.headerLogoContainer}>
      <LinearGradient
        colors={['rgba(108, 92, 231, 0.15)', 'rgba(108, 92, 231, 0)']}
        style={styles.logoBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Image 
          source={require('./assets/logo2.png')} 
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </LinearGradient>
    </View>
  );
};

// Create the Quest stack with Home, Add, and Detail screens
const QuestStackScreen = () => (
  <QuestStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
        elevation: 0, // Remove shadow on Android
        shadowOpacity: 0, // Remove shadow on iOS
        height: 110, // Taller header for better visibility
      },
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
    }}
  >
    <QuestStack.Screen 
      name="QuestList" 
      component={HomeScreen} 
      options={{
        headerTitle: (props) => <LogoTitle {...props} />,
        title: 'My Quests',
      }}
    />
    <QuestStack.Screen 
      name="AddQuest" 
      component={AddQuestScreen} 
      options={{ 
        title: 'New Quest',
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 4,
          shadowOpacity: 0.2,
          height: 90,
        },
      }}
    />
    <QuestStack.Screen 
      name="QuestDetail" 
      component={QuestDetailScreen} 
      options={{ 
        title: 'Quest Details',
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 4,
          shadowOpacity: 0.2,
          height: 90,
        },
      }}
    />
  </QuestStack.Navigator>
);

// Main App component
export default function App() {
  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style="light" />
      <TaskProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                
                if (route.name === 'Quests') {
                  iconName = focused ? 'map-marker-path' : 'map-marker';
                } else if (route.name === 'Stats') {
                  iconName = focused ? 'trophy-award' : 'trophy-outline';
                }
                
                return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: COLORS.primary,
              tabBarInactiveTintColor: COLORS.textSecondary,
              tabBarStyle: {
                paddingVertical: 8,
                borderTopWidth: 0,
                elevation: 8,
                shadowOpacity: 0.1,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: -2 },
                height: 60,
                backgroundColor: '#fff',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '600',
                paddingBottom: 4,
              },
              tabBarItemStyle: {
                paddingTop: 4,
              }
            })}
          >
            <Tab.Screen name="Quests" component={QuestStackScreen} />
            <Tab.Screen 
              name="Stats" 
              component={StatsScreen} 
              options={{
                headerShown: true,
                headerStyle: { 
                  backgroundColor: COLORS.primary,
                  elevation: 0,
                  shadowOpacity: 0,
                  height: 90,
                },
                headerTintColor: '#fff',
                headerTitle: 'My Progress',
                headerTitleAlign: 'center',
                headerTitleStyle: {
                  fontSize: 20,
                  fontWeight: '600',
                },
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </TaskProvider>
    </PaperProvider>
  );
}

// Styles
const styles = StyleSheet.create({
  headerLogoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 8,
    width: Dimensions.get('window').width * 0.7,
  },
  logoBackground: {
    padding: 8,
    borderRadius: RADIUS.lg,
    width: '100%',
    alignItems: 'center',
  },
  headerLogo: {
    width: 160,
    height: 48,
    resizeMode: 'contain',
  },
});
