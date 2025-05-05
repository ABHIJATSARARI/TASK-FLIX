const axios = require('axios');
require('dotenv').config();

// Token cache to avoid repeatedly requesting new tokens
let tokenCache = {
  token: null,
  expiresAt: 0
};

/**
 * Reset the token cache
 */
const resetTokenCache = () => {
  console.log('Resetting IBM token cache');
  tokenCache = {
    token: null,
    expiresAt: 0
  };
  return { success: true, message: 'Token cache reset successfully' };
};

/**
 * Get IBM Cloud IAM token, either from cache or by generating a new one
 */
const getIBMToken = async () => {
  const currentTime = Date.now();
  
  // If we have a valid token in cache, use it
  if (tokenCache.token && currentTime < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  try {
    // Request a new token
    const response = await axios({
      method: 'POST',
      url: 'https://iam.cloud.ibm.com/identity/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      data: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${process.env.IBM_API_KEY}`
    });

    // Store token in cache with expiration (token is valid for 3600 seconds = 1 hour)
    // Set expiry 5 minutes before actual expiry to be safe
    const expiresIn = response.data.expires_in;
    tokenCache.token = response.data.access_token;
    tokenCache.expiresAt = currentTime + (expiresIn - 300) * 1000; // Convert to milliseconds and subtract 5 minutes
    
    console.log('New IBM token generated');
    return tokenCache.token;
  } catch (error) {
    console.error('Error generating IBM token:', error.response?.data || error.message);
    throw new Error('Failed to obtain IBM authentication token');
  }
};

module.exports = { getIBMToken, resetTokenCache };