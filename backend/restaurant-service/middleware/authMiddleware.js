const axios = require('axios');

// Auth service URL from environment variables
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Middleware to verify JWT token and check if user is authorized
const protect = async (req, res, next) => {
  let token;
  
  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      console.log('Verifying token with auth service:', AUTH_SERVICE_URL);
      
      // IMPORTANT: Use the correct endpoint for token verification
      // This should match exactly what's in the auth service
      const verificationEndpoint = `${AUTH_SERVICE_URL}/api/auth/verify-token`;
      console.log('Token verification endpoint:', verificationEndpoint);
      
      // Verify token by calling auth service
      const { data } = await axios.post(verificationEndpoint, {
        token
      });
      
      console.log('Token verification response:', data);
      
      // Check if verification was successful
      if (!data.success) {
        console.error('Token verification failed:', data.message);
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token verification failed'
        });
      }
      
      // Set user in request
      req.user = data.user;
      
      return next();
    } catch (error) {
      console.error('Error verifying token:', error.message);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  } else {
    console.error('No authorization header found');
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Middleware to restrict access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.error('User object not found in request');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found'
      });
    }
    
    console.log('Checking user role:', req.user.userType);
    
    if (roles.includes(req.user.userType)) {
      return next();
    } else {
      console.error(`User is not authorized. Required roles: ${roles.join(', ')}, User role: ${req.user.userType}`);
      return res.status(403).json({
        success: false,
        message: `Not authorized as ${roles.join(' or ')}`
      });
    }
  };
};

// Legacy middleware for backward compatibility 
const restaurantAdmin = (req, res, next) => {
  return authorize('restaurant-admin')(req, res, next);
};

module.exports = { protect, restaurantAdmin, authorize }; 