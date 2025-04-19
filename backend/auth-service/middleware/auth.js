const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ServiceAccount = require('../models/ServiceAccount');
const { isBlacklisted } = require('../utils/tokenBlacklist');
const { isServiceToken, isUserToken } = require('../utils/jwtUtils');

/**
 * Middleware for protecting routes - works with both user and service tokens
 */
exports.protect = async (req, res, next) => {
  let token;
  
  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Or from cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
  
  try {
    // Check if token is blacklisted
    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked. Please login again.'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle both user and service tokens
    if (isUserToken(token)) {
      // Find user from database
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Set user object on request
      req.user = user;
      req.tokenType = 'user';
      req.permissions = decoded.permissions || [];
    }
    else if (isServiceToken(token)) {
      // Find service account from database
      const serviceAccount = await ServiceAccount.findById(decoded.serviceId);
      
      if (!serviceAccount || !serviceAccount.active) {
        return res.status(401).json({
          success: false,
          message: 'Service account not found or inactive'
        });
      }
      
      // Set service account object on request
      req.serviceAccount = {
        id: serviceAccount._id,
        name: serviceAccount.name,
        clientId: serviceAccount.clientId,
        serviceName: serviceAccount.serviceName
      };
      req.tokenType = 'service';
      req.scopes = decoded.scopes || [];
      
      // Add special INTERNAL_SERVICE permission for service accounts
      req.permissions = ['INTERNAL_SERVICE'];
    }
    else {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Handle different JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

/**
 * Middleware to restrict access based on role or permission
 */
exports.restrictTo = (...allowedPermissions) => {
  return (req, res, next) => {
    // For user tokens, check permissions
    if (req.tokenType === 'user' && req.permissions) {
      const hasPermission = req.permissions.some(permission => 
        allowedPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action'
        });
      }
    }
    // For service tokens, check scopes
    else if (req.tokenType === 'service' && req.scopes) {
      // Special case for INTERNAL_SERVICE permission - always granted to service accounts
      if (allowedPermissions.includes('INTERNAL_SERVICE')) {
        return next();
      }
      
      // Otherwise, map the required permissions to relevant scopes
      // This is a simplified approach - expand as needed
      const requiredScopes = allowedPermissions.map(perm => {
        // Map permissions to scopes as needed
        if (perm === 'READ') return `${req.serviceAccount.serviceName}:read`;
        if (perm === 'WRITE') return `${req.serviceAccount.serviceName}:write`;
        if (perm === 'ADMIN') return `${req.serviceAccount.serviceName}:admin`;
        return perm.toLowerCase();
      });
      
      const hasScope = req.scopes.some(scope => 
        requiredScopes.includes(scope)
      );
      
      if (!hasScope) {
        return res.status(403).json({
          success: false,
          message: 'Service account does not have the required scopes'
        });
      }
    }
    else {
      return res.status(403).json({
        success: false,
        message: 'Invalid token type or missing permissions'
      });
    }
    
    next();
  };
};

/**
 * Middleware to validate service-specific scope
 */
exports.requireScope = (requiredScope) => {
  return (req, res, next) => {
    // Only applicable for service tokens
    if (req.tokenType !== 'service' || !req.scopes) {
      return res.status(403).json({
        success: false,
        message: 'This route requires a service token with specific scopes'
      });
    }
    
    if (!req.scopes.includes(requiredScope)) {
      return res.status(403).json({
        success: false,
        message: `Missing required scope: ${requiredScope}`
      });
    }
    
    next();
  };
}; 