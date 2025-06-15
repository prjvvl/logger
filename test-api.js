// Simple test script to verify the Logger API
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'test123token456'; // Default token for 'test_site'

async function testAPI() {
  console.log('🚀 Testing Logger API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);    // Test 2: Submit a test log
    console.log('\n2. Testing log submission...');    const testLog = {
      timestamp: new Date().toISOString(),
      source: 'test_site',
      level: 'info',
      message: 'Test log message from API test',
      details: {
        user_id: 'test_user_123',
        feature: 'api_test',
        browser: 'test_browser'
      },
      action: null,
      group: 'api_tests',
      position: 1
    };

    const logResponse = await axios.post(`${BASE_URL}/api/logs`, testLog, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Log submission:', logResponse.data);    // Test 3: Submit an alert log
    console.log('\n3. Testing alert log submission...');    const alertLog = {
      timestamp: new Date().toISOString(),
      source: 'test_site',
      level: 'error',
      message: 'Test alert message',
      details: {
        error_code: 'TEST_001',
        stack_trace: 'Test stack trace'
      },
      action: 'alert',
      group: 'errors',
      position: 2
    };

    const alertResponse = await axios.post(`${BASE_URL}/api/logs`, alertLog, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Alert log submission:', alertResponse.data);

    // Test 4: Retrieve logs
    console.log('\n4. Testing log retrieval...');
    const logsResponse = await axios.get(`${BASE_URL}/api/logs?limit=5`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    console.log('✅ Log retrieval:', {
      success: logsResponse.data.success,
      count: logsResponse.data.data?.length || 0,
      total: logsResponse.data.total
    });

    // Test 5: Get sources
    console.log('\n5. Testing sources endpoint...');
    const sourcesResponse = await axios.get(`${BASE_URL}/api/sources`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    console.log('✅ Sources:', sourcesResponse.data);

    // Test 6: Get groups
    console.log('\n6. Testing groups endpoint...');
    const groupsResponse = await axios.get(`${BASE_URL}/api/groups?source=test_site`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    console.log('✅ Groups:', groupsResponse.data);

    console.log('\n🎉 All tests passed! The Logger API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

// Install axios if not present and run tests
const { execSync } = require('child_process');

try {
  require('axios');
} catch (e) {
  console.log('Installing axios for testing...');
  execSync('npm install axios', { stdio: 'inherit' });
}

testAPI();
