import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { TextInput, Button, Headline, Subheading, Chip, HelperText, Text, Card, Paragraph } from 'react-native-paper';
import { TaskContext } from '../context/TaskContext';
import { generateQuestNarrative } from '../utils/aiTransformer';

// Category and difficulty data
const categories = [
  { key: 'work', label: 'Work', icon: '💼' },
  { key: 'personal', label: 'Personal', icon: '🌟' },
  { key: 'health', label: 'Health', icon: '❤️' },
  { key: 'learning', label: 'Learning', icon: '📚' },
  { key: 'chores', label: 'Chores', icon: '🧹' },
];

const difficulties = [
  { key: 'mini', label: 'Mini Quest', icon: '🔰', description: 'Quick and easy (10 XP)', color: '#4CAF50' },
  { key: 'normal', label: 'Normal Quest', icon: '⚔️', description: 'Balanced challenge (25 XP)', color: '#2196F3' },
  { key: 'boss', label: 'Boss Quest', icon: '👑', description: 'Major challenge (50 XP)', color: '#FF5722' },
];

const AddQuestScreen = ({ navigation }) => {
  const { addTask } = useContext(TaskContext);
  
  // State variables
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [questPreview, setQuestPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Prevent duplicate submissions
  const submitLock = useRef(false);

  // Generate a preview when title, category, and difficulty are set
  useEffect(() => {
    const generatePreview = async () => {
      if (title.trim() && category && difficulty) {
        setLoading(true);
        try {
          const narrative = await generateQuestNarrative(title, category, difficulty);
          setQuestPreview(narrative);
        } catch (error) {
          console.error('Error generating quest preview:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setQuestPreview(null);
      }
    };
    
    // Debounce to avoid too many calls
    const timeoutId = setTimeout(generatePreview, 800);
    return () => clearTimeout(timeoutId);
  }, [title, category, difficulty]);

  // Form validation
  const validate = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Quest name is required';
    }
    
    if (!category) {
      newErrors.category = 'Please select a category';
    }
    
    if (!difficulty) {
      newErrors.difficulty = 'Please select a difficulty';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle quest creation
  const handleCreateQuest = async () => {
    // Prevent duplicate submissions
    if (submitLock.current || isSubmitting) return;
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    submitLock.current = true;
    setLoading(true);
    
    try {
      // Create the new task
      const newTask = {
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
      };
      
      // Use the updated addTask function which now handles navigation
      await addTask(newTask, navigation);
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setDifficulty('');
      setQuestPreview(null);
      
    } catch (error) {
      console.error('Error creating quest:', error);
      Alert.alert('Error', 'Failed to create quest. Please try again.');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      // Release lock after a short delay to prevent rapid multi-clicks
      setTimeout(() => {
        submitLock.current = false;
      }, 1000);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Headline style={styles.headline}>Create New Quest</Headline>
          <Paragraph style={styles.subtitle}>
            Transform your mundane task into an epic adventure!
          </Paragraph>
        </Card.Content>
      </Card>
      
      {/* Task input fields */}
      <View style={styles.formSection}>
        <Subheading style={styles.sectionTitle}>Quest Details</Subheading>
        
        <TextInput
          label="Quest Name"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          mode="outlined"
          error={!!errors.title}
          disabled={loading || isSubmitting}
        />
        {errors.title && <HelperText type="error">{errors.title}</HelperText>}
        
        <TextInput
          label="Quest Description (Optional)"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={3}
          disabled={loading || isSubmitting}
        />
      </View>
      
      {/* Category selection */}
      <View style={styles.formSection}>
        <Subheading style={styles.sectionTitle}>Quest Category</Subheading>
        
        <View style={styles.chipContainer}>
          {categories.map(item => (
            <TouchableOpacity 
              key={item.key}
              onPress={() => setCategory(item.key)}
              disabled={loading || isSubmitting}
            >
              <Chip
                selected={category === item.key}
                style={[
                  styles.chip,
                  category === item.key ? styles.selectedChip : null
                ]}
                selectedColor={category === item.key ? '#6200ee' : undefined}
              >
                {item.icon} {item.label}
              </Chip>
            </TouchableOpacity>
          ))}
        </View>
        {errors.category && <HelperText type="error">{errors.category}</HelperText>}
      </View>
      
      {/* Difficulty selection */}
      <View style={styles.formSection}>
        <Subheading style={styles.sectionTitle}>Quest Difficulty</Subheading>
        
        <View style={styles.difficultyContainer}>
          {difficulties.map(item => (
            <TouchableOpacity 
              key={item.key}
              onPress={() => setDifficulty(item.key)}
              disabled={loading || isSubmitting}
            >
              <Card 
                style={[
                  styles.difficultyCard,
                  difficulty === item.key ? { borderColor: item.color, borderWidth: 2 } : null
                ]}
              >
                <Card.Content style={styles.difficultyContent}>
                  <Text style={styles.difficultyIcon}>{item.icon}</Text>
                  <Text style={[
                    styles.difficultyLabel, 
                    difficulty === item.key ? { color: item.color, fontWeight: 'bold' } : null
                  ]}>
                    {item.label}
                  </Text>
                  <Text style={styles.difficultyDescription}>{item.description}</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
        {errors.difficulty && <HelperText type="error">{errors.difficulty}</HelperText>}
      </View>
      
      {/* Quest preview */}
      {(loading || questPreview) && (
        <View style={styles.previewContainer}>
          <Subheading style={styles.sectionTitle}>Quest Preview</Subheading>
          
          <Card style={styles.previewCard}>
            <Card.Content>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#6200ee" />
                  <Text style={styles.loadingText}>Preparing your epic quest...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.previewTitle}>
                    Your task will become a grand adventure!
                  </Text>
                  <Paragraph style={styles.previewText}>{questPreview}</Paragraph>
                </>
              )}
            </Card.Content>
          </Card>
        </View>
      )}
      
      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={handleCreateQuest} 
          style={styles.createButton}
          disabled={loading || isSubmitting}
          loading={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Quest'}
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => navigation.goBack()} 
          style={styles.cancelButton}
          disabled={loading || isSubmitting}
        >
          Cancel
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
  headerCard: {
    marginBottom: 16,
    backgroundColor: '#6200ee',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
  },
  headline: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formSection: {
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  input: {
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    margin: 4,
    paddingHorizontal: 4,
  },
  selectedChip: {
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  difficultyCard: {
    width: 100,
    marginBottom: 12,
    elevation: 1,
  },
  difficultyContent: {
    alignItems: 'center',
    padding: 8,
  },
  difficultyIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  difficultyLabel: {
    fontWeight: '500',
    marginBottom: 4,
    fontSize: 13,
    textAlign: 'center',
  },
  difficultyDescription: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
  previewContainer: {
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  previewCard: {
    backgroundColor: '#f8f4ff',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  previewTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#6200ee',
  },
  previewText: {
    fontStyle: 'italic',
    lineHeight: 22,
  },
  buttonContainer: {
    padding: 16,
    marginBottom: 24,
  },
  createButton: {
    paddingVertical: 8,
    borderRadius: 25,
    marginBottom: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    borderRadius: 25,
  },
});

export default AddQuestScreen;