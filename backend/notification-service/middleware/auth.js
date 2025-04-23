const jwt = require('jsonwebtoken');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if auth header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Not authorized to access this route' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user from payload to request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: 'Not authorized to access this route' 
    });
  }
};

// Service auth for internal service-to-service communication
exports.serviceAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  // For simplicity, using a static API key for service-to-service comm
  // In production, use a more robust solution with rotating keys or mutual TLS
  if (!apiKey || apiKey !== process.env.SERVICE_API_KEY) {
    return res.status(401).json({ 
      success: false, 
      error: 'Not authorized for service-to-service communication' 
    });
  }

  next();
}; 