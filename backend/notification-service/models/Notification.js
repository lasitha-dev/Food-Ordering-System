const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  orderId: {
    type: String,
    required: false
  },
  type: {
    type: String,
    enum: ['ORDER_STATUS', 'DELIVERY_UPDATE', 'SYSTEM'],
    default: 'SYSTEM'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema); 