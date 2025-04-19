const { validateToken } = require('../utils/tokenValidator');

/**
 * @desc    Validate a token
 * @route   POST /api/token/validate
 * @access  Service-to-Service
 */
exports.validateAccessToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }
    
    // Validate the token
    const result = await validateToken(token);
    
    if (!result.valid) {
      return res.status(401).json({
        success: false,
        message: result.message
      });
    }
    
    // Return validation result
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: result.user
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Introspect a token (get its contents without full validation)
 * @route   POST /api/token/introspect
 * @access  Service-to-Service
 */
exports.introspectToken = async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required'
    });
  }
  
  try {
    // Just parse the token without validating it
    const decoded = require('jsonwebtoken').decode(token);
    
    if (!decoded) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format'
      });
    }
    
    // Return token contents
    res.status(200).json({
      success: true,
      data: {
        id: decoded.id,
        email: decoded.email,
        userType: decoded.userType,
        permissions: decoded.permissions || [],
        exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
        iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null
      }
    });
  } catch (error) {
    console.error('Token introspection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 