/**
 * IBM Granite API Connection Test Script
 * 
 * This script tests:
 * 1. Environment variables loading
 * 2. IBM Cloud authentication token generation
 * 3. IBM Granite API connectivity
 * 4. Basic prompt generation
 */
require('dotenv').config();
const { getIBMToken } = require('./services/authService');
const { transformTaskToQuest, generateMotivationalMessage } = require('./services/graniteService');
const axios = require('axios');

// ANSI color codes for prettier console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

/**
 * Run a test and log the result
 */
async function runTest(name, testFn) {
  process.stdout.write(`${colors.bright}Testing ${name}... ${colors.reset}`);
  
  try {
    const result = await testFn();
    console.log(`${colors.green}✓ PASSED${colors.reset}`);
    return { success: true, result };
  } catch (error) {
    console.log(`${colors.red}✗ FAILED${colors.reset}`);
    console.error(`  ${colors.red}Error:${colors.reset} ${error.message}`);
    if (error.response?.data) {
      console.error(`  ${colors.red}API Response:${colors.reset}`, JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, error };
  }
}

/**
 * Check if required environment variables are set
 */
async function checkEnvironmentVariables() {
  const requiredVars = ['IBM_API_KEY', 'IBM_URL', 'IBM_MODEL_ID', 'IBM_PROJECT_ID'];
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  return {
    apiKey: process.env.IBM_API_KEY ? '****' + process.env.IBM_API_KEY.slice(-4) : undefined,
    url: process.env.IBM_URL,
    model: process.env.IBM_MODEL_ID,
    project: process.env.IBM_PROJECT_ID
  };
}

/**
 * Test IBM token generation
 */
async function testTokenGeneration() {
  const token = await getIBMToken();
  if (!token) {
    throw new Error('Token generation returned empty token');
  }
  return { token: token.substring(0, 10) + '...' };
}

/**
 * Test direct API call to IBM Granite
 */
async function testDirectAPICall() {
  const token = await getIBMToken();
  
  const response = await axios({
    method: 'POST',
    url: process.env.IBM_URL,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    data: {
      input: "Respond with: 'API connection successful'",
      parameters: {
        decoding_method: "greedy",
        max_new_tokens: 20,
        min_new_tokens: 0,
        stop_sequences: [],
        repetition_penalty: 1
      },
      model_id: process.env.IBM_MODEL_ID,
      project_id: process.env.IBM_PROJECT_ID
    }
  });
  
  return { 
    status: response.status,
    response: response.data
  };
}

/**
 * Test task transformation through our service
 */
async function testTaskTransformation() {
  const result = await transformTaskToQuest('Write code', 'work', 'normal');
  return result;
}

/**
 * Test motivational message generation
 */
async function testMotivationalMessage() {
  const result = await generateMotivationalMessage();
  return result;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(`\n${colors.cyan}====================================${colors.reset}`);
  console.log(`${colors.cyan}    IBM GRANITE CONNECTION TESTER    ${colors.reset}`);
  console.log(`${colors.cyan}====================================${colors.reset}\n`);
  
  // Test environment variables
  const envTest = await runTest('environment variables', checkEnvironmentVariables);
  if (envTest.success) {
    console.log(`  ${colors.yellow}API Key:${colors.reset} ${envTest.result.apiKey}`);
    console.log(`  ${colors.yellow}URL:${colors.reset} ${envTest.result.url}`);
    console.log(`  ${colors.yellow}Model ID:${colors.reset} ${envTest.result.model}`);
    console.log(`  ${colors.yellow}Project ID:${colors.reset} ${envTest.result.project}\n`);
  }
  
  // Only continue if environment variables are properly set
  if (!envTest.success) {
    console.log(`\n${colors.red}Environment variables are not properly configured. Exiting tests.${colors.reset}\n`);
    process.exit(1);
  }
  
  // Test token generation
  const tokenTest = await runTest('IBM Cloud authentication', testTokenGeneration);
  if (tokenTest.success) {
    console.log(`  ${colors.yellow}Token:${colors.reset} ${tokenTest.result.token}\n`);
  }
  
  // Only continue if token generation worked
  if (!tokenTest.success) {
    console.log(`\n${colors.red}IBM Cloud authentication failed. Exiting tests.${colors.reset}\n`);
    process.exit(1);
  }
  
  // Test direct API call
  await runTest('direct API call to IBM Granite', testDirectAPICall);
  
  // Test task transformation
  const taskTest = await runTest('task transformation service', testTaskTransformation);
  if (taskTest.success) {
    console.log(`  ${colors.yellow}Quest Title:${colors.reset} ${taskTest.result.questTitle}`);
    console.log(`  ${colors.yellow}Quest Narrative:${colors.reset} ${taskTest.result.questNarrative}\n`);
  }
  
  // Test motivational message
  const messageTest = await runTest('motivational message service', testMotivationalMessage);
  if (messageTest.success) {
    console.log(`  ${colors.yellow}Message:${colors.reset} ${messageTest.result}\n`);
  }
  
  // Summary
  const allPassed = [envTest, tokenTest, taskTest, messageTest].every(t => t.success);
  
  console.log(`\n${colors.cyan}====================================${colors.reset}`);
  console.log(`${colors.cyan}              SUMMARY              ${colors.reset}`);
  console.log(`${colors.cyan}====================================${colors.reset}\n`);
  
  if (allPassed) {
    console.log(`${colors.green}✓ All tests passed! IBM Granite API is properly configured and working.${colors.reset}\n`);
    console.log(`To start the server: ${colors.magenta}node server.js${colors.reset}\n`);
  } else {
    console.log(`${colors.red}✗ Some tests failed. Please check the errors above and fix configuration.${colors.reset}\n`);
  }
}

// Run all the tests
runAllTests().catch(error => {
  console.error(`\n${colors.red}Unexpected error:${colors.reset}`, error);
});