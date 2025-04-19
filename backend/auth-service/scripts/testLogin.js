const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login API with admin credentials...');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@fooddelivery.com',
      password: 'Admin@123456'
    });
    
    console.log('Login successful!');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Login failed with error:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      if (error.response.data.message === 'Invalid credentials') {
        console.log('\nPossible issues:');
        console.log('1. Password hashing issue - check bcrypt version and salt rounds');
        console.log('2. User record in database might be corrupted');
        console.log('3. Email case sensitivity - check exact casing in database');
      }
    } else if (error.request) {
      console.error('No response received. Is the server running?');
      console.error('Request details:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    throw error;
  }
}

// Run immediately
(async () => {
  try {
    await testLogin();
    console.log('Test completed successfully');
  } catch (error) {
    console.log('Test failed');
  } finally {
    console.log('Test execution finished');
  }
})(); 