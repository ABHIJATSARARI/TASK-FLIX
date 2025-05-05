/**
 * Animation utilities for TaskFlick app
 * Contains reusable animation configurations and helper functions
 */

import { Animated, Easing, Platform } from 'react-native';
import { TIMING } from './theme';

// Helper function to determine if native driver should be used
// This helps avoid warnings on web platform
export const shouldUseNativeDriver = () => {
  return Platform.OS !== 'web';
};

/**
 * Creates a bouncing animation
 * @param {Animated.Value} value - The animated value to animate
 * @param {number} toValue - The target value
 * @param {number} duration - The duration of the animation in ms
 * @param {Function} callback - Optional callback function after animation completes
 * @returns {Animated.CompositeAnimation} The animation object
 */
export const createBounceAnimation = (
  value,
  toValue = 1,
  duration = TIMING.normal,
  callback = () => {}
) => {
  return Animated.spring(value, {
    toValue,
    friction: 7,
    tension: 40,
    useNativeDriver: shouldUseNativeDriver(),
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
  }).start(callback);
};

/**
 * Creates a pulse animation that loops
 * @param {Animated.Value} value - The animated value to animate
 * @param {number} minValue - The minimum value of the pulse
 * @param {number} maxValue - The maximum value of the pulse
 * @param {number} duration - The duration of each pulse in ms
 * @returns {Animated.CompositeAnimation} The animation object
 */
export const createPulseAnimation = (
  value,
  minValue = 0.97,
  maxValue = 1.03,
  duration = TIMING.normal
) => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: maxValue,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: shouldUseNativeDriver(),
      }),
      Animated.timing(value, {
        toValue: minValue,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: shouldUseNativeDriver(),
      }),
    ])
  ).start();
};

/**
 * Creates a fade in animation
 * @param {Animated.Value} value - The animated value to animate
 * @param {number} duration - The duration of the animation in ms
 * @param {Function} callback - Optional callback function after animation completes
 * @returns {Animated.CompositeAnimation} The animation object
 */
export const fadeIn = (
  value,
  duration = TIMING.normal,
  callback = () => {}
) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: shouldUseNativeDriver(),
  }).start(callback);
};

/**
 * Creates a fade out animation
 * @param {Animated.Value} value - The animated value to animate
 * @param {number} duration - The duration of the animation in ms
 * @param {Function} callback - Optional callback function after animation completes
 * @returns {Animated.CompositeAnimation} The animation object
 */
export const fadeOut = (
  value,
  duration = TIMING.normal,
  callback = () => {}
) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: shouldUseNativeDriver(),
  }).start(callback);
};

/**
 * Creates a slide animation
 * @param {Animated.Value} value - The animated value to animate
 * @param {number} from - The starting position
 * @param {number} to - The ending position
 * @param {number} duration - The duration of the animation in ms
 * @param {Function} callback - Optional callback function after animation completes
 * @returns {Animated.CompositeAnimation} The animation object
 */
export const slide = (
  value,
  from,
  to,
  duration = TIMING.normal,
  callback = () => {}
) => {
  value.setValue(from);
  return Animated.timing(value, {
    toValue: to,
    duration,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: shouldUseNativeDriver(),
  }).start(callback);
};

/**
 * Creates a quest completion animation sequence
 * @param {Animated.Value} scale - Scale animated value
 * @param {Animated.Value} opacity - Opacity animated value
 * @param {Function} callback - Optional callback function after animation completes
 */
export const questCompletionAnimation = (scale, opacity, callback = () => {}) => {
  Animated.sequence([
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1.2,
        duration: TIMING.short,
        easing: Easing.out(Easing.ease),
        useNativeDriver: shouldUseNativeDriver(),
      }),
      Animated.timing(opacity, {
        toValue: 0.7,
        duration: TIMING.short,
        useNativeDriver: shouldUseNativeDriver(),
      }),
    ]),
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: shouldUseNativeDriver(),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: TIMING.normal,
        useNativeDriver: shouldUseNativeDriver(),
      }),
    ]),
  ]).start(callback);
};

/**
 * Creates a staggered animation for lists
 * @param {Array<Animated.Value>} animations - Array of animated values
 * @param {number} staggerDelay - Delay between each animation
 * @param {Function} animationCreator - Function that returns an animation for each value
 * @param {Function} callback - Optional callback function after all animations complete
 */
export const staggeredAnimations = (
  animations,
  staggerDelay = 50,
  animationCreator = (value) => 
    Animated.spring(value, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: shouldUseNativeDriver(),
    }),
  callback = () => {}
) => {
  const staggered = Animated.stagger(
    staggerDelay,
    animations.map(animationCreator)
  );
  
  Animated.parallel([staggered]).start(callback);
};

/**
 * Creates a shake animation
 * @param {Animated.Value} value - The animated value to animate
 * @param {number} distance - The distance to shake
 * @param {number} duration - The duration of the animation in ms
 * @param {Function} callback - Optional callback function after animation completes
 */
export const shakeAnimation = (
  value,
  distance = 10,
  duration = TIMING.normal,
  callback = () => {}
) => {
  Animated.sequence([
    Animated.timing(value, {
      toValue: distance,
      duration: duration / 5,
      useNativeDriver: shouldUseNativeDriver(),
    }),
    Animated.timing(value, {
      toValue: -distance,
      duration: duration / 5,
      useNativeDriver: shouldUseNativeDriver(),
    }),
    Animated.timing(value, {
      toValue: distance / 2,
      duration: duration / 5,
      useNativeDriver: shouldUseNativeDriver(),
    }),
    Animated.timing(value, {
      toValue: -distance / 2,
      duration: duration / 5,
      useNativeDriver: shouldUseNativeDriver(),
    }),
    Animated.timing(value, {
      toValue: 0,
      duration: duration / 5,
      useNativeDriver: shouldUseNativeDriver(),
    }),
  ]).start(callback);
};