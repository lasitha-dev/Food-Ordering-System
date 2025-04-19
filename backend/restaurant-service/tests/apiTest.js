// Simple test script to verify endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

const testPublicEndpoint = async () => {
  try {
    console.log('Testing public food items endpoint...');
    const response = await axios.get(`${BASE_URL}/api/food-items/public`);
    
    console.log('Response status:', response.status);
    console.log('Food items count:', response.data.count);
    console.log('Sample food item:', response.data.data[0]);
    
    console.log('Public endpoint test successful!');
    return true;
  } catch (error) {
    console.error('Error testing public endpoint:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
};

// Run the tests
const runTests = async () => {
  console.log('===== API TESTS =====');
  
  const publicEndpointSuccess = await testPublicEndpoint();
  
  console.log('\nTest Results:');
  console.log('Public endpoint test:', publicEndpointSuccess ? 'PASSED' : 'FAILED');
  
  console.log('\n===== END TESTS =====');
};

runTests(); 