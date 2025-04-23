const express = require('express');
const router = express.Router();
const { serviceAuth } = require('../middleware/auth');
const deliveryNotificationService = require('../services/deliveryNotificationService');

// Create a delivery status notification
router.post('/status-update', serviceAuth, async (req, res) => {
  try {
    const notification = await deliveryNotificationService.createDeliveryStatusNotification(req.body);
    
    // If socket.io is configured, emit event
    if (req.app.get('io')) {
      req.app.get('io').to(req.body.userId).emit('notification', notification);
    }
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating delivery notification:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Server Error' 
    });
  }
});

// Create an order status notification
router.post('/order-status', serviceAuth, async (req, res) => {
  try {
    const notification = await deliveryNotificationService.createOrderStatusNotification(req.body);
    
    // If socket.io is configured, emit event
    if (req.app.get('io')) {
      req.app.get('io').to(req.body.userId).emit('notification', notification);
    }
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating order status notification:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Server Error' 
    });
  }
});

module.exports = router; 