/**
 * Utilities for handling backend server connection
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';

/**
 * List of possible backend server URLs to try
 */
const getPossibleServerUrls = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  // Store the explicitly configured URL first if available
  const urls = configuredUrl ? [configuredUrl] : [];
  
  // Standard localhost URLs (useful for development)
  urls.push('http://localhost:3000/api');
  urls.push('http://127.0.0.1:3000/api');
  
  // Add Android emulator specific host
  if (Platform.OS === 'android') {
    urls.push('http://10.0.2.2:3000/api'); // Special IP for Android emulator
  }
  
  // Add iOS simulator specific host
  if (Platform.OS === 'ios') {
    urls.push('http://localhost:3000/api');
  }
  
  // Try to get the Expo host URI - handle different Expo SDK versions
  let devServerHost;
  try {
    // For newer Expo SDK
    devServerHost = Constants.expoConfig?.hostUri;
    
    // For older Expo SDK
    if (!devServerHost && Constants.manifest) {
      devServerHost = Constants.manifest.debuggerHost || Constants.manifest.hostUri;
    }
  } catch (err) {
    console.log('Error accessing Expo host information:', err);
  }
  
  // If running on a real device, try the local network IP if available
  if (devServerHost) {
    const host = devServerHost.split(':')[0]; // Remove port if present
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      urls.push(`http://${host}:3000/api`);
    }
  } else {
    // If we cannot get host info, try some common local network IPs
    // This helps when running on real devices
    urls.push('http://192.168.1.1:3000/api');
    urls.push('http://192.168.0.1:3000/api');
  }
  
  // Return a deduplicated list
  return [...new Set(urls)];
};

/**
 * Test if a backend URL is reachable
 * @param {string} url - URL to test
 * @returns {Promise<boolean>} - Whether the URL is reachable
 */
const isUrlReachable = async (url) => {
  try {
    // Try to fetch the health endpoint
    const healthUrl = url.endsWith('/api') 
      ? `${url}/health`
      : `${url}/api/health`;
    
    console.log(`Testing connection to: ${healthUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout
    
    const response = await fetch(healthUrl, { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Connection successful to ${url}:`, data);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`Connection failed to ${url}:`, error.message);
    return false;
  }
};

/**
 * Find a working backend server URL
 * @returns {Promise<string|null>} - Working URL or null if none found
 */
export const discoverBackendUrl = async () => {
  // First check if we have a cached working URL
  try {
    const cachedUrl = await AsyncStorage.getItem('working_backend_url');
    if (cachedUrl) {
      console.log('Testing cached backend URL:', cachedUrl);
      const isReachable = await isUrlReachable(cachedUrl);
      if (isReachable) {
        console.log('Cached backend URL is working:', cachedUrl);
        return cachedUrl;
      }
      console.log('Cached backend URL is not reachable, will try alternatives');
    }
  } catch (error) {
    console.error('Error checking cached URL:', error);
  }
  
  // Check network connectivity first
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    console.log('Device is offline, cannot connect to backend');
    return null;
  }
  
  // Try all possible URLs
  const urls = getPossibleServerUrls();
  console.log('Attempting to discover backend URL from candidates:', urls);
  
  for (const url of urls) {
    const isReachable = await isUrlReachable(url);
    if (isReachable) {
      console.log('Found working backend URL:', url);
      // Cache the working URL for future use
      try {
        await AsyncStorage.setItem('working_backend_url', url);
      } catch (error) {
        console.error('Error caching working URL:', error);
      }
      return url;
    }
  }
  
  console.log('No working backend URL found');
  return null;
};

/**
 * Create a complete API URL based on the discovered backend URL
 * @param {string} endpoint - API endpoint path
 * @param {string} [baseUrl] - Optional base URL (will discover if not provided)
 * @returns {Promise<string|null>} - Complete API URL or null if backend not available
 */
export const getApiUrl = async (endpoint, baseUrl = null) => {
  const backendUrl = baseUrl || await discoverBackendUrl();
  if (!backendUrl) return null;
  
  // Normalize the endpoint to ensure it doesn't have extra slashes
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Make sure we have the /api part in the URL
  if (backendUrl.endsWith('/api')) {
    return `${backendUrl}/${normalizedEndpoint}`;
  } else if (backendUrl.endsWith('/')) {
    return `${backendUrl}api/${normalizedEndpoint}`;
  } else {
    return `${backendUrl}/api/${normalizedEndpoint}`;
  }
};