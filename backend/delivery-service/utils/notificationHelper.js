const axios = require('axios');

/**
 * Sends a notification to the notification service when delivery status is updated
 * @param {Object} orderData - Order data containing user and delivery information
 * @param {String} status - New delivery status
 * @param {String} deliveryPersonName - Name of delivery person (optional)
 * @returns {Promise<Object>} - Response from notification service
 */
const sendDeliveryStatusNotification = async (orderData, status, deliveryPersonName = null) => {
  try {
    // Make sure we have the necessary data
    if (!orderData || !orderData.userId || !orderData._id) {
      console.error('Missing required order data for notification');
      return null;
    }

    // Define notification payload
    const notificationPayload = {
      userId: orderData.userId,
      orderId: orderData._id,
      status: status,
      deliveryPersonName: deliveryPersonName
    };

    // Get service API key from environment
    const serviceApiKey = process.env.SERVICE_API_KEY;
    
    if (!serviceApiKey) {
      console.error('Missing SERVICE_API_KEY environment variable');
      return null;
    }

    // Send notification to notification service
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006';
    
    const response = await axios.post(
      `${notificationServiceUrl}/api/delivery-notifications/status-update`,
      notificationPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': serviceApiKey
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error sending delivery status notification:', error.message);
    return null;
  }
};

module.exports = {
  sendDeliveryStatusNotification
}; 