const ServiceAccount = require('../models/ServiceAccount');
const { generateServiceToken, isServiceToken } = require('../utils/jwtUtils');
const { isBlacklisted, blacklistToken } = require('../utils/tokenBlacklist');

/**
 * @desc    Authenticate a service using client credentials
 * @route   POST /api/services/authenticate
 * @access  Public
 */
exports.authenticateService = async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;
    
    // Validate required fields
    if (!clientId || !clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Please provide clientId and clientSecret'
      });
    }
    
    // Find the service account
    const serviceAccount = await ServiceAccount.findOne({ clientId })
      .select('+clientSecret');
    
    if (!serviceAccount) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if service account is active
    if (!serviceAccount.active) {
      return res.status(401).json({
        success: false,
        message: 'Service account is disabled'
      });
    }
    
    // Verify client secret
    const isValidSecret = await serviceAccount.compareSecret(clientSecret);
    if (!isValidSecret) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update last used timestamp
    serviceAccount.lastUsed = Date.now();
    await serviceAccount.save({ validateBeforeSave: false });
    
    // Generate service token
    const token = generateServiceToken(serviceAccount);
    
    // Return the token and service information
    res.status(200).json({
      success: true,
      data: {
        token,
        serviceAccount: {
          name: serviceAccount.name,
          serviceName: serviceAccount.serviceName,
          scopes: serviceAccount.scopes
        }
      }
    });
  } catch (error) {
    console.error('Service authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Validate a service token
 * @route   POST /api/services/validate
 * @access  Service-to-Service
 */
exports.validateServiceToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }
    
    // Check if token is a service token
    if (!isServiceToken(token)) {
      return res.status(401).json({
        success: false,
        message: 'Not a valid service token'
      });
    }
    
    // Check if token is blacklisted
    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }
    
    // Decode the token
    const decoded = require('jsonwebtoken').decode(token);
    
    // Verify token signature and expiration
    const isValid = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Check if the service account exists and is active
    const serviceAccount = await ServiceAccount.findById(decoded.serviceId);
    if (!serviceAccount || !serviceAccount.active) {
      return res.status(401).json({
        success: false,
        message: 'Service account not found or inactive'
      });
    }
    
    // Return validation result
    res.status(200).json({
      success: true,
      message: 'Service token is valid',
      data: {
        clientId: decoded.clientId,
        serviceName: decoded.serviceName,
        scopes: decoded.scopes
      }
    });
  } catch (error) {
    // Handle JWT verification errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    console.error('Service token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Revoke a service token
 * @route   POST /api/services/revoke
 * @access  Service-to-Service
 */
exports.revokeServiceToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }
    
    // Check if token is a service token
    if (!isServiceToken(token)) {
      return res.status(400).json({
        success: false,
        message: 'Not a valid service token'
      });
    }
    
    // Blacklist the token
    await blacklistToken(token);
    
    res.status(200).json({
      success: true,
      message: 'Service token revoked successfully'
    });
  } catch (error) {
    console.error('Revoke service token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 