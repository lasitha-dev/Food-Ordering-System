const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  logout, 
  refreshToken,
  revokeAllTokens,
  changePassword,
  setInitialPassword,
  debugEnsureAdmin,
  debugResetAllPasswords,
  debugCheckDatabase
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/set-password', setInitialPassword);
router.post('/change-password', changePassword);

// Debug routes - only for development
router.get('/debug/ensure-admin', debugEnsureAdmin);
router.get('/debug/reset-all-passwords', debugResetAllPasswords);
router.get('/debug/check-db', debugCheckDatabase);

// Protected routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.post('/revokeAll', protect, revokeAllTokens);
router.put('/change-password', protect, changePassword);

// Add this route for token verification by other services
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from the decoded token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return success with user info
    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    // Handle different types of JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Server error during token verification'
      });
    }
  }
});

// Add a health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is running',
    mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

module.exports = router; 