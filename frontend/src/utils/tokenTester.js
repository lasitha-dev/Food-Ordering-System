/**
 * Utility functions to help debug authentication issues
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_RESTAURANT_SERVICE_URL || 'http://localhost:3002';

/**
 * Test token verification directly
 */
export const testTokenVerification = async () => {
  try {
    console.log('Testing token verification...');
    
    // Get token from various possible sources
    let token = localStorage.getItem('token');
    let source = 'direct';
    
    if (!token) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo);
          if (parsed.token) {
            token = parsed.token;
            source = 'userInfo.token';
          }
        } catch (e) {
          console.error('Error parsing userInfo:', e);
        }
      }
    }
    
    if (!token) {
      console.error('No token found in localStorage');
      return {
        success: false,
        message: 'No token found in localStorage'
      };
    }
    
    console.log(`Token found in ${source}`);
    
    // Test direct token verification
    const response = await axios.post(`${API_URL}/api/debug/verify-token`, { token });
    
    console.log('Verification test response:', response.data);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Token verification test failed:', error);
    
    return {
      success: false,
      error: error.message,
      details: error.response ? error.response.data : null
    };
  }
};

/**
 * Test if authentication headers are being sent correctly
 */
export const testAuthHeaders = async () => {
  try {
    console.log('Testing auth headers...');
    
    // Get token from various possible sources
    let token = localStorage.getItem('token');
    let source = 'direct';
    
    if (!token) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo);
          if (parsed.token) {
            token = parsed.token;
            source = 'userInfo.token';
          }
        } catch (e) {
          console.error('Error parsing userInfo:', e);
        }
      }
    }
    
    const headers = {};
    if (token) {
      console.log(`Using token from ${source}`);
      headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No token found for Authorization header');
    }
    
    const response = await axios.get(`${API_URL}/api/debug/check-headers`, { headers });
    
    console.log('Headers check response:', response.data);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Headers test failed:', error);
    
    return {
      success: false,
      error: error.message,
      details: error.response ? error.response.data : null
    };
  }
}; 