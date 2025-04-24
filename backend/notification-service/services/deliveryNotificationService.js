const Notification = require('../models/Notification');
const emailService = require('./emailService');

/**
 * Create a notification for delivery status update
 * @param {Object} payload - Notification payload
 * @param {String} payload.userId - User ID to send notification to
 * @param {String} payload.orderId - Order ID
 * @param {String} payload.status - New delivery status
 * @param {String} payload.deliveryPersonName - Name of delivery person (optional)
 * @param {String} payload.email - Optional email for notifications
 * @returns {Promise<Object>} Created notification object
 */
exports.createDeliveryStatusNotification = async (payload) => {
  try {
    const { userId, orderId, status, deliveryPersonName, email } = payload;
    
    if (!userId || !orderId || !status) {
      throw new Error('Missing required fields: userId, orderId, or status');
    }
    
    let message = '';
    
    // Generate appropriate message based on status
    switch (status) {
      case 'Assigned':
        message = `Your order #${orderId} has been assigned to a delivery person${deliveryPersonName ? ` (${deliveryPersonName})` : ''}.`;
        break;
      case 'Accepted':
        message = `Delivery for your order #${orderId} has been accepted${deliveryPersonName ? ` by ${deliveryPersonName}` : ''}.`;
        break;
      case 'Picked Up':
        message = `Your order #${orderId} has been picked up${deliveryPersonName ? ` by ${deliveryPersonName}` : ''} and is on the way.`;
        break;
      case 'Delivered':
        message = `Your order #${orderId} has been delivered. Enjoy your meal!`;
        break;
      default:
        message = `Delivery status for order #${orderId} updated to: ${status}`;
    }
    
    const notification = await Notification.create({
      userId,
      message,
      orderId,
      type: 'DELIVERY_UPDATE',
      metadata: {
        deliveryStatus: status,
        deliveryPersonName: deliveryPersonName || null
      }
    });
    
    // Send email notification if email is provided and status is relevant
    if (email && ['Accepted', 'Picked Up', 'Delivered'].includes(status)) {
      try {
        console.log(`Sending email notification to ${email} for order ${orderId} with status ${status}`);
        await emailService.sendOrderStatusEmail(email, orderId, status, deliveryPersonName || 'Your delivery person');
        console.log(`Email notification sent successfully to ${email}`);
      } catch (emailError) {
        // Don't fail the notification creation if email fails
        console.error('Error sending email notification:', emailError);
      }
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating delivery notification:', error);
    throw error;
  }
};

/**
 * Create a notification for order status update
 * @param {Object} payload - Notification payload
 * @param {String} payload.userId - User ID to send notification to
 * @param {String} payload.orderId - Order ID
 * @param {String} payload.status - New order status
 * @param {String} payload.email - Optional email for notifications
 * @returns {Promise<Object>} Created notification object
 */
exports.createOrderStatusNotification = async (payload) => {
  try {
    const { userId, orderId, status, email } = payload;
    
    if (!userId || !orderId || !status) {
      throw new Error('Missing required fields: userId, orderId, or status');
    }
    
    let message = '';
    
    // Generate appropriate message based on status
    switch (status) {
      case 'Confirmed':
        message = `Your order #${orderId} has been confirmed by the restaurant.`;
        break;
      case 'Preparing':
        message = `The restaurant has started preparing your order #${orderId}.`;
        break;
      case 'Ready':
        message = `Your order #${orderId} is ready for pickup by delivery.`;
        break;
      case 'Out for Delivery':
        message = `Your order #${orderId} is out for delivery.`;
        break;
      case 'Delivered':
        message = `Your order #${orderId} has been delivered. Enjoy your meal!`;
        break;
      case 'Cancelled':
        message = `Your order #${orderId} has been cancelled.`;
        break;
      default:
        message = `Order #${orderId} status updated to: ${status}`;
    }
    
    const notification = await Notification.create({
      userId,
      message,
      orderId,
      type: 'ORDER_STATUS',
      metadata: {
        orderStatus: status
      }
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating order status notification:', error);
    throw error;
  }
}; 