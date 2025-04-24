const Order = require('../models/Order');
const Cart = require('../models/Cart');

/**
 * @desc   Get all orders for the current user
 * @route  GET /api/orders
 * @access Private
 */
exports.getUserOrders = async (req, res) => {
  try {
    // Find all orders for current user, sorted by creation date (newest first)
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Get a single order by ID
 * @route  GET /api/orders/:id
 * @access Private
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Only allow users to access their own orders unless they're an admin
    if (order.userId.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Create a new order
 * @route  POST /api/orders
 * @access Private
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      subtotal,
      deliveryFee,
      tip,
      total,
      deliveryAddress,
      additionalInstructions,
      paymentMethod,
      notificationEmail
    } = req.body;
    
    // Validate required fields
    if (!items || !subtotal || !total || !deliveryAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Create order
    const order = await Order.create({
      userId: req.user.id,
      items,
      subtotal,
      deliveryFee: deliveryFee || 0,
      tip: tip || 0,
      total,
      deliveryAddress,
      additionalInstructions: additionalInstructions || '',
      notificationEmail: notificationEmail || '',
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'unpaid'
    });
    
    // If order is created successfully, clear the user's cart
    if (order) {
      // Find user's cart
      const cart = await Cart.findOne({ userId: req.user.id });
      
      if (cart) {
        // Clear cart items
        cart.items = [];
        cart.total = 0;
        
        // Save cart
        await cart.save();
      }
    }
    
    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Update order payment status
 * @route  PUT /api/orders/:id/payment
 * @access Private
 */
exports.updateOrderPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide payment ID'
      });
    }
    
    // Find order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Only allow users to update their own orders
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }
    
    // Update payment status
    order.paymentStatus = 'paid';
    order.paymentId = paymentId;
    order.paymentDate = Date.now();
    
    // Save order
    await order.save();
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error updating order payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Delete an order
 * @route  DELETE /api/orders/:id
 * @access Private
 */
exports.deleteOrder = async (req, res) => {
  try {
    // Find order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Allow either the order owner or restaurant admins to delete the order
    if (order.userId.toString() !== req.user.id && req.user.userType !== 'restaurant-admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this order'
      });
    }
    
    // Delete order
    await order.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {},
      message: 'Order successfully deleted'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Get all orders for restaurant admin (paid or cash on delivery)
 * @route  GET /api/orders/restaurant
 * @access Private (restaurant-admin)
 */
exports.getRestaurantOrders = async (req, res) => {
  try {
    // Check if user is restaurant admin
    if (req.user.userType !== 'restaurant-admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only restaurant admins can view these orders.'
      });
    }
    
    // Find all orders that are either paid by card or are cash on delivery
    const orders = await Order.find({
      $or: [
        { paymentStatus: 'paid' },
        { paymentMethod: 'cash' }
      ]
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching restaurant orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Update order status
 * @route  PUT /api/orders/:id/status
 * @access Private (restaurant-admin)
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid order status'
      });
    }
    
    // Check if user is restaurant admin
    if (req.user.userType !== 'restaurant-admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only restaurant admins can update order status.'
      });
    }
    
    // Find order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Update order status
    order.status = status;
    
    // If status is Delivered and payment method is cash, update payment status to paid
    if (status === 'Delivered' && order.paymentMethod === 'cash') {
      order.paymentStatus = 'paid';
      order.paymentDate = Date.now();
    }
    
    // Save order
    await order.save();
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Assign order to delivery personnel
 * @route  PUT /api/orders/:id/assign
 * @access Private (restaurant-admin)
 */
exports.assignOrder = async (req, res) => {
  try {
    const { deliveryPersonnelId, deliveryPersonnelName } = req.body;
    
    // Validate required data
    if (!deliveryPersonnelId || !deliveryPersonnelName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide delivery personnel ID and name'
      });
    }
    
    // Check if user is restaurant admin
    if (req.user.userType !== 'restaurant-admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only restaurant admins can assign orders.'
      });
    }
    
    // Find order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Update order
    order.assignedTo = deliveryPersonnelId;
    order.assignedToName = deliveryPersonnelName;
    order.deliveryStatus = 'Assigned';
    order.status = 'Out for Delivery';
    
    // Save order
    await order.save();
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Get assigned orders for delivery personnel
 * @route  GET /api/orders/delivery/assigned
 * @access Private (delivery-personnel)
 */
exports.getAssignedOrders = async (req, res) => {
  try {
    // Check if user is delivery personnel
    if (req.user.userType !== 'delivery-personnel') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only delivery personnel can view assigned orders.'
      });
    }
    
    // Find orders assigned to this delivery personnel
    const orders = await Order.find({
      assignedTo: req.user.id,
      deliveryStatus: { $in: ['Assigned', 'Accepted', 'Picked Up'] }
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching assigned orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Update delivery status
 * @route  PUT /api/orders/:id/delivery-status
 * @access Private (delivery-personnel)
 */
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['Accepted', 'Picked Up', 'Delivered', 'Rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid delivery status'
      });
    }
    
    // Check if user is delivery personnel
    if (req.user.userType !== 'delivery-personnel') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only delivery personnel can update delivery status.'
      });
    }
    
    // Find order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if this order is assigned to this delivery personnel
    if (order.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to this order.'
      });
    }
    
    // Update order status
    order.deliveryStatus = status;
    
    // Update timestamps based on status
    if (status === 'Accepted') {
      order.deliveryAcceptedAt = Date.now();
    } else if (status === 'Picked Up') {
      order.deliveryPickedUpAt = Date.now();
    } else if (status === 'Delivered') {
      order.deliveryCompletedAt = Date.now();
      order.status = 'Delivered';
      
      // If payment method is cash, update payment status to paid
      if (order.paymentMethod === 'cash') {
        order.paymentStatus = 'paid';
        order.paymentDate = Date.now();
      }
    } else if (status === 'Rejected') {
      // If delivery personnel rejects the order, unassign them
      order.assignedTo = null;
      order.assignedToName = null;
      order.deliveryStatus = 'Unassigned';
    }
    
    // Save order
    await order.save();

    // Send notification to customer about delivery status update
    try {
      // Only send notifications for customer-relevant statuses
      if (['Accepted', 'Picked Up', 'Delivered'].includes(status)) {
        const notificationPayload = {
          userId: order.userId.toString(),
          orderId: order._id.toString(),
          status: status,
          deliveryPersonName: req.user.name || order.assignedToName
        };

        // Add email to notification payload if available
        if (order.notificationEmail) {
          notificationPayload.email = order.notificationEmail;
        }

        // Make request to notification service
        const axios = require('axios');
        const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006';
        
        await axios.post(
          `${notificationServiceUrl}/api/delivery-notifications/status-update`,
          notificationPayload,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.SERVICE_API_KEY
            }
          }
        );
        
        console.log(`Notification sent to customer for order ${order._id} with status ${status}`);
      }
    } catch (notificationError) {
      // Don't fail the status update if notification fails
      console.error('Error sending notification:', notificationError);
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 