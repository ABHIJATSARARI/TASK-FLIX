/**
 * Theme configuration for TaskFlick app
 * Contains color palette, typography, spacing, and timing constants
 */

import { Dimensions } from 'react-native';
import { DefaultTheme } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

// Color palette
export const COLORS = {
  // Primary colors - More vibrant purple/blue
  primary: '#6C5CE7', 
  primaryDark: '#5247B5',
  primaryLight: '#A29BFE',
  
  // Secondary colors - Bright pink for visual impact
  secondary: '#FF6B9B', 
  secondaryDark: '#E0477E',
  secondaryLight: '#FFA8C7',
  
  // Accent colors - Golden for achievements and highlights
  accent: '#FFC048', 
  accentDark: '#F0A817',
  accentLight: '#FFDF7E',
  
  // Success/Error/Warning/Info states - More saturated colors
  success: '#00D07E',
  error: '#FF4C6A',
  warning: '#FFAA2C',
  info: '#2BD9FE',
  
  // Neutral colors - Cleaner backgrounds
  background: '#F7F9FF',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  divider: '#E9EDFF',
  
  // Text colors - Higher contrast
  textPrimary: '#16163F',
  textSecondary: '#616188',
  textDisabled: '#9E9EB8',
  textInverse: '#FFFFFF',
  
  // Status colors - Brighter and more noticeable
  completed: '#00E288',
  inProgress: '#6C5CE7',
  notStarted: '#9E9EB8',
  overdue: '#FF4C6A',
  
  // Quest difficulty colors - More distinct and vibrant
  mini: '#00CBA3',    // Teal for mini quests
  normal: '#6C5CE7',  // Purple for normal quests
  boss: '#FF3A5E',    // Bright red for boss quests
  
  // Category colors - More distinctive and vibrant
  work: '#4A63FF',
  personal: '#9857DB',
  health: '#00C4B4',
  learning: '#2BBFFF',
  chores: '#FF7E5F',
  
  // Gradient backgrounds for cards and headers
  gradients: {
    primary: ['#6C5CE7', '#8C7BFE'],
    secondary: ['#FF6B9B', '#FF93BC'],
    success: ['#00D07E', '#00F196'],
    boss: ['#FF3A5E', '#FF6B8B']
  },
  
  // Optional: background for motivation message
  motivationBackground: 'rgba(255, 255, 255, 0.25)',
  
  // Dark mode adjustments will be added in future versions
  dark: {
    background: '#16163F',
    surface: '#252550',
    card: '#353566',
    textPrimary: '#F5F5FF',
    textSecondary: '#BDBDFF',
  }
};

// Typography
export const FONTS = {
  sizes: {
    h1: 28,
    h2: 24,
    h3: 20,
    h4: 18,
    body1: 16,
    body2: 14,
    caption: 12,
    button: 16,
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  families: {
    primary: 'System', // Default system font
    secondary: 'System', // Can be replaced with custom fonts
  }
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Screen specific margins
  screenHorizontal: 16,
  screenVertical: 24,
  
  // Component specific
  cardPadding: 16,
  buttonPadding: 12,
  inputPadding: 12,
};

// Border radius - More rounded corners for modern look
export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  round: 1000, // For circular elements
};

// Timing (ms)
export const TIMING = {
  short: 150,
  normal: 300,
  medium: 500,
  long: 700,
};

// Shadows - Enhanced for more depth
export const SHADOWS = {
  small: {
    shadowColor: "#6C5CE7",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.10,
    shadowRadius: 2.00,
    elevation: 1,
    boxShadow: '0px 1px 2px rgba(108, 92, 231, 0.10)'
  },
  medium: {
    shadowColor: "#6C5CE7",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.16,
    shadowRadius: 4.00,
    elevation: 5,
    boxShadow: '0px 3px 4px rgba(108, 92, 231, 0.16)'
  },
  large: {
    shadowColor: "#6C5CE7",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.23,
    shadowRadius: 6.00,
    elevation: 10,
    boxShadow: '0px 6px 6px rgba(108, 92, 231, 0.23)'
  },
  glow: {
    shadowColor: "#6C5CE7",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 12,
    boxShadow: '0px 0px 10px rgba(108, 92, 231, 0.30)'
  }
};

// Device dimensions
export const DIMENSIONS = {
  width,
  height,
  isSmallDevice: width < 375,
};

// Animation constants
export const ANIMATION = {
  scaleButton: 0.97,
  opacityButton: 0.8,
  scale: {
    in: 0.9,
    out: 1,
  },
  fadeIn: {
    from: 0,
    to: 1,
  }
};

// Common styles
export const commonStyles = {
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.cardPadding,
    ...SHADOWS.medium,
  },
  questCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.cardPadding,
    ...SHADOWS.medium,
    marginBottom: SPACING.md,
  },
  button: {
    primary: {
      backgroundColor: COLORS.primary,
      paddingVertical: SPACING.buttonPadding,
      paddingHorizontal: SPACING.buttonPadding * 2.5, // Wider buttons
      borderRadius: RADIUS.round, // Fully rounded buttons
      ...SHADOWS.small,
    },
    secondary: {
      backgroundColor: COLORS.secondary,
      paddingVertical: SPACING.buttonPadding,
      paddingHorizontal: SPACING.buttonPadding * 2.5,
      borderRadius: RADIUS.round,
      ...SHADOWS.small,
    },
    outline: {
      backgroundColor: 'transparent',
      paddingVertical: SPACING.buttonPadding,
      paddingHorizontal: SPACING.buttonPadding * 2.5,
      borderRadius: RADIUS.round,
      borderWidth: 1.5,
      borderColor: COLORS.primary,
    },
    icon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      ...SHADOWS.small,
    }
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.screenHorizontal,
    paddingVertical: SPACING.screenVertical,
  },
  input: {
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    borderColor: COLORS.divider,
    padding: SPACING.inputPadding,
  },
  header: {
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    ...SHADOWS.medium,
    marginBottom: SPACING.md,
  },
  badge: {
    standard: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.round,
      backgroundColor: COLORS.accent,
    },
    small: {
      paddingHorizontal: SPACING.xs,
      paddingVertical: 2,
      borderRadius: RADIUS.round,
      backgroundColor: COLORS.accent,
    }
  }
};

// Export Paper theme configuration
export const paperTheme = {
  ...DefaultTheme,
  roundness: RADIUS.md,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    accent: COLORS.accent,
    background: COLORS.background,
    surface: COLORS.surface,
    text: COLORS.textPrimary,
    error: COLORS.error,
    disabled: COLORS.textDisabled,
    placeholder: COLORS.textSecondary,
    backdrop: 'rgba(16, 16, 63, 0.5)', // More theme-appropriate backdrop
    notification: COLORS.secondary,
  },
  fonts: {
    ...DefaultTheme.fonts,
    // You can customize fonts here if needed
  },
  animation: {
    scale: 1.0,
  },
};

// Export a default theme object with all properties
export default {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  TIMING,
  SHADOWS,
  DIMENSIONS,
  ANIMATION,
  commonStyles,
  paperTheme,
};