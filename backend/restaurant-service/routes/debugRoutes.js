const express = require('express');
const axios = require('axios');
const router = express.Router();

// Auth service URL from environment variables
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Route to check token verification
router.post('/verify-token', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required'
    });
  }
  
  try {
    console.log('Attempting to verify token with auth service:', AUTH_SERVICE_URL);
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/token/verify`, {
      token
    });
    
    console.log('Auth service response:', response.data);
    
    return res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error verifying token with auth service:', error.message);
    
    // Return more details about the error
    return res.status(500).json({
      success: false,
      message: 'Error verifying token',
      error: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'No response from auth service'
    });
  }
});

// Route to check auth headers
router.get('/check-headers', (req, res) => {
  const authHeader = req.headers.authorization;
  
  return res.json({
    success: true,
    hasAuthHeader: Boolean(authHeader),
    authHeader: authHeader || 'None',
    allHeaders: req.headers
  });
});

module.exports = router; 