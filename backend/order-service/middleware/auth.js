const jwt = require('jsonwebtoken');

/**
 * Middleware to protect routes - requires valid JWT token
 */
exports.protect = async (req, res, next) => {
  let token;

  console.log('Auth middleware checking for token');
  console.log('Authorization header:', req.headers.authorization);

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Extract token from Bearer token
    token = req.headers.authorization.split(' ')[1];
    console.log('Found token in Authorization header');
  } 
  // Also check if token was sent in a cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('Found token in cookies');
  }

  // If no token found, return 401 Unauthorized
  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify the token
    console.log('Verifying token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified successfully, user ID:', decoded.id);

    // Add the decoded user data to the request object
    req.user = {
      id: decoded.id,
      userType: decoded.userType
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    
    // Provide more specific error messages based on error type
    let message = 'Token invalid or expired';
    if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token format';
    } else if (error.name === 'TokenExpiredError') {
      message = 'Token has expired';
    }
    
    return res.status(401).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware to restrict access to specific user types
 */
exports.restrictTo = (...userTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    if (!userTypes.includes(req.user.userType)) {
      console.log(`Access denied: User type ${req.user.userType} not in allowed types:`, userTypes);
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${userTypes.join(' or ')}`
      });
    }
    
    next();
  };
}; 