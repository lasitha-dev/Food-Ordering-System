const { verifyToken } = require('./jwtUtils');
const { isBlacklisted } = require('./tokenBlacklist');
const User = require('../models/User');

/**
 * Validate a token and return user information
 * This is a centralized validation function that can be exposed via an API endpoint
 * for other microservices to validate tokens
 * 
 * @param {String} token - The token to validate
 * @returns {Object} Object containing validation result and user info
 */
const validateToken = async (token) => {
  try {
    // Check if token exists
    if (!token) {
      return {
        valid: false,
        message: 'No token provided'
      };
    }

    // Check if token is blacklisted
    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      return {
        valid: false,
        message: 'Token has been revoked'
      };
    }

    // Verify token signature and expiration
    const decoded = verifyToken(token);
    if (!decoded) {
      return {
        valid: false,
        message: 'Invalid or expired token'
      };
    }

    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return {
        valid: false,
        message: 'User not found'
      };
    }

    // Check if user is active
    if (!user.active) {
      return {
        valid: false,
        message: 'User account is disabled'
      };
    }

    // Token is valid, return user info
    return {
      valid: true,
      message: 'Token is valid',
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        permissions: decoded.permissions || []
      }
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return {
      valid: false,
      message: 'Error validating token'
    };
  }
};

module.exports = {
  validateToken
}; 