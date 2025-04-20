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
      paymentMethod
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
    
    // Only allow users to delete their own orders
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this order'
      });
    }
    
    // Delete order
    await order.remove();
    
    res.status(200).json({
      success: true,
      data: {}
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