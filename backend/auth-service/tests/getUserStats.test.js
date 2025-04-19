/**
 * Manual test script for the getUserStats endpoint
 * 
 * Run with: node tests/getUserStats.test.js
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
const API_URL = `${BASE_URL}/api/admin/users/stats`;

// Admin credentials for testing
const adminEmail = 'admin@fooddelivery.com';
const adminPassword = 'Admin@123456';

async function testGetUserStats() {
  try {
    console.log('Testing getUserStats endpoint...');
    console.log(`BASE_URL: ${BASE_URL}`);
    console.log(`API_URL: ${API_URL}`);
    
    // First login as admin to get token
    console.log('Logging in as admin...');
    console.log(`Login URL: ${BASE_URL}/api/auth/login`);
    console.log(`Credentials: ${adminEmail} / ${adminPassword}`);
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: adminEmail,
      password: adminPassword
    });
    
    if (!loginResponse.data.success) {
      console.error('Login failed:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('Login successful, got token');
    
    // Call the stats endpoint with admin token
    console.log('Calling stats endpoint...');
    const statsResponse = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Stats endpoint response:');
    console.log(JSON.stringify(statsResponse.data, null, 2));
    
    // Verify the response structure
    if (statsResponse.data.success) {
      const { total, admins, restaurantAdmins, deliveryPersonnel, customers } = statsResponse.data.data;
      console.log('\nUser statistics:');
      console.log('----------------');
      console.log(`Total Users: ${total}`);
      console.log(`Admins: ${admins}`);
      console.log(`Restaurant Admins: ${restaurantAdmins}`);
      console.log(`Delivery Personnel: ${deliveryPersonnel}`);
      console.log(`Customers: ${customers}`);
      console.log('----------------');
      
      // Validate that counts add up
      const sum = admins + restaurantAdmins + deliveryPersonnel + customers;
      if (sum === total) {
        console.log('\n✅ Validation passed: Counts add up correctly');
      } else {
        console.log(`\n❌ Validation failed: Sum of user types (${sum}) doesn't match total (${total})`);
      }
    } else {
      console.error('Stats endpoint returned error:', statsResponse.data);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received. Server might not be running.');
      console.error('Request details:', error.request._currentUrl);
    } else {
      console.error('Error details:', error);
    }
  }
}

// Run the test
testGetUserStats(); 