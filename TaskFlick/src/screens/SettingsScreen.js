import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Switch, Button, Card, Divider, Title, Paragraph, List, Surface } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUseBackendGeneration, setUseBackendGeneration } from '../utils/aiTransformer';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../utils/theme';
import { LinearGradient } from 'expo-linear-gradient';

// Import environment variables
import { 
  API_BASE_URL,
  USE_BACKEND_GENERATION,
  SHOW_SERVER_LOGS 
} from '@env';

const SettingsScreen = () => {
  const [useBackend, setUseBackend] = useState(USE_BACKEND_GENERATION === 'true');
  const [showLogs, setShowLogs] = useState(SHOW_SERVER_LOGS === 'true');
  const [isLoading, setIsLoading] = useState(false);
  const [backendUrl, setBackendUrl] = useState(API_BASE_URL || 'http://localhost:3000/api');
  
  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);
  
  // Load saved settings from AsyncStorage
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const useBackendValue = await getUseBackendGeneration();
      setUseBackend(useBackendValue);
      
      const showLogsValue = await AsyncStorage.getItem('showServerLogs');
      if (showLogsValue !== null) {
        setShowLogs(showLogsValue === 'true');
      }
      
      const savedUrl = await AsyncStorage.getItem('backendUrl');
      if (savedUrl) {
        setBackendUrl(savedUrl);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle backend generation
  const toggleBackendGeneration = async (value) => {
    try {
      setUseBackend(value);
      await setUseBackendGeneration(value);
      
      if (value) {
        Alert.alert(
          "AI Generation Enabled",
          "Quests will now be generated using IBM Granite AI through the backend server.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Local Generation Enabled",
          "Quests will now be generated locally using templates.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Failed to toggle backend generation:", error);
      Alert.alert("Error", "Failed to update settings. Please try again.");
    }
  };
  
  // Toggle server logs
  const toggleServerLogs = async (value) => {
    try {
      setShowLogs(value);
      await AsyncStorage.setItem('showServerLogs', value ? 'true' : 'false');
    } catch (error) {
      console.error("Failed to toggle server logs:", error);
    }
  };
  
  // Reset all settings to defaults
  const resetSettings = async () => {
    Alert.alert(
      "Reset Settings",
      "Are you sure you want to reset all settings to defaults?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('useBackendGeneration');
              await AsyncStorage.removeItem('showServerLogs');
              await AsyncStorage.removeItem('backendUrl');
              
              setUseBackend(USE_BACKEND_GENERATION === 'true');
              setShowLogs(SHOW_SERVER_LOGS === 'true');
              setBackendUrl(API_BASE_URL || 'http://localhost:3000/api');
              
              Alert.alert("Success", "Settings have been reset to defaults.");
            } catch (error) {
              console.error("Failed to reset settings:", error);
              Alert.alert("Error", "Failed to reset settings. Please try again.");
            }
          } 
        }
      ]
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={COLORS.gradients.primary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Title style={styles.headerTitle}>Settings</Title>
        <Paragraph style={styles.headerSubtitle}>
          Configure your quest generation preferences
        </Paragraph>
      </LinearGradient>
      
      <Surface style={styles.settingsContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Quest Generation</Title>
            <Divider style={styles.divider} />
            
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Use AI Generation</Text>
                <Text style={styles.settingDescription}>
                  Generate quests using IBM Granite AI through the backend server. 
                  Turn off to use local template-based generation.
                </Text>
              </View>
              <Switch
                value={useBackend}
                onValueChange={toggleBackendGeneration}
                color={COLORS.primary}
                disabled={isLoading}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Show Server Logs</Text>
                <Text style={styles.settingDescription}>
                  Display detailed logs about API requests to the backend server
                </Text>
              </View>
              <Switch
                value={showLogs}
                onValueChange={toggleServerLogs}
                color={COLORS.primary}
                disabled={isLoading}
              />
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Technical Information</Title>
            <Divider style={styles.divider} />
            
            <List.Section>
              <List.Item
                title="Backend URL"
                description={backendUrl}
                left={() => <List.Icon icon="server" color={COLORS.primary} />}
              />
              <List.Item
                title="Current Mode"
                description={useBackend ? "AI Generation (Backend)" : "Template Generation (Local)"}
                left={() => <List.Icon icon={useBackend ? "brain" : "text-box-outline"} color={useBackend ? COLORS.primary : COLORS.secondary} />}
              />
              <List.Item
                title="IBM Granite"
                description="Model: granite-13b-instruct-v2"
                left={() => <List.Icon icon="robot" color={COLORS.accent} />}
              />
            </List.Section>
          </Card.Content>
        </Card>
        
        <Button 
          mode="outlined" 
          onPress={resetSettings}
          style={styles.resetButton}
          color={COLORS.error}
        >
          Reset to Defaults
        </Button>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
  },
  headerTitle: {
    color: COLORS.textInverse,
    fontWeight: FONTS.weights.bold,
    fontSize: FONTS.sizes.h2,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: SPACING.xs,
  },
  settingsContainer: {
    padding: SPACING.md,
  },
  card: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.medium,
  },
  sectionTitle: {
    fontWeight: FONTS.weights.bold,
    fontSize: FONTS.sizes.h3,
    marginBottom: SPACING.sm,
  },
  divider: {
    marginVertical: SPACING.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingTitle: {
    fontWeight: FONTS.weights.medium,
    fontSize: FONTS.sizes.body1,
  },
  settingDescription: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.body2,
    marginTop: 2,
  },
  resetButton: {
    marginTop: SPACING.md,
    borderColor: COLORS.error,
  }
});

export default SettingsScreen;