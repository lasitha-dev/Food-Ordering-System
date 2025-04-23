const Notification = require('../models/Notification');

// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Private (Service-to-Service)
exports.createNotification = async (req, res) => {
  try {
    const { userId, message, orderId, type, metadata } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide userId and message' 
      });
    }

    const notification = await Notification.create({
      userId,
      message,
      orderId,
      type: type || 'SYSTEM',
      metadata: metadata || {}
    });

    // If socket.io is configured, emit event
    if (req.app.get('io')) {
      req.app.get('io').to(userId).emit('notification', notification);
    }

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server Error' 
    });
  }
};

// @desc    Get notifications for a user
// @route   GET /api/notifications/user/:userId
// @access  Private
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 }) // Sort by most recent first
      .limit(50); // Limit to 50 most recent notifications
    
    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server Error' 
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }
    
    // Make sure user owns the notification
    if (notification.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to access this notification' 
      });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server Error' 
    });
  }
};

// @desc    Mark all notifications as read for a user
// @route   PUT /api/notifications/user/:userId/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Make sure user is authorized
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to update these notifications' 
      });
    }
    
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    
    res.status(200).json({
      success: true,
      count: result.modifiedCount,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server Error' 
    });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }
    
    // Make sure user owns the notification
    if (notification.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to delete this notification' 
      });
    }
    
    await notification.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server Error' 
    });
  }
}; 