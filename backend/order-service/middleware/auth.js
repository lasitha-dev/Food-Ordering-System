const jwt = require('jsonwebtoken');

/**
 * Middleware to protect routes - requires valid JWT token
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Extract token from Bearer token
    token = req.headers.authorization.split(' ')[1];
  } 
  // Also check if token was sent in a cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token found, return 401 Unauthorized
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add the decoded user data to the request object
    req.user = {
      id: decoded.id,
      userType: decoded.userType
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalid or expired'
    });
  }
};

/**
 * Middleware to restrict access to specific user types
 */
exports.restrictTo = (...userTypes) => {
  return (req, res, next) => {
    if (!req.user || !userTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    next();
  };
}; 