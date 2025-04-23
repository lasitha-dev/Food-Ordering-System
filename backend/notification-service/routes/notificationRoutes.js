const express = require('express');
const router = express.Router();
const { 
  createNotification, 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} = require('../controllers/notificationController');
const { protect, serviceAuth } = require('../middleware/auth');

// Routes that require service-to-service authentication
router.post('/', serviceAuth, createNotification);

// Routes that require user authentication
router.get('/user/:userId', protect, getUserNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/user/:userId/read-all', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router; 