const Cart = require('../models/Cart');

/**
 * @desc   Get current user's cart
 * @route  GET /api/cart
 * @access Private
 */
exports.getUserCart = async (req, res) => {
  try {
    // Find cart for current user
    let cart = await Cart.findOne({ userId: req.user.id });
    
    // If no cart exists, create an empty one
    if (!cart) {
      cart = await Cart.create({
        userId: req.user.id,
        items: [],
        total: 0
      });
    }
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Add item to cart
 * @route  POST /api/cart/items
 * @access Private
 */
exports.addItemToCart = async (req, res) => {
  try {
    const { _id, title, price, quantity, image, categoryId } = req.body;
    
    if (!_id || !title || !price || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Find cart for current user
    let cart = await Cart.findOne({ userId: req.user.id });
    
    // If no cart exists, create one
    if (!cart) {
      cart = await Cart.create({
        userId: req.user.id,
        items: [],
        total: 0
      });
    }
    
    // Check if item already exists in cart
    const itemIndex = cart.items.findIndex(item => item._id === _id);
    
    if (itemIndex > -1) {
      // Update quantity if item exists
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        _id,
        title,
        price,
        quantity,
        image,
        categoryId
      });
    }
    
    // Save cart
    await cart.save();
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Update item quantity in cart
 * @route  PUT /api/cart/items/:itemId
 * @access Private
 */
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }
    
    // Find cart for current user
    let cart = await Cart.findOne({ userId: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Find item in cart
    const itemIndex = cart.items.findIndex(item => item._id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    
    // Save cart
    await cart.save();
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Remove item from cart
 * @route  DELETE /api/cart/items/:itemId
 * @access Private
 */
exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Find cart for current user
    let cart = await Cart.findOne({ userId: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Remove item from cart
    cart.items = cart.items.filter(item => item._id !== itemId);
    
    // Save cart
    await cart.save();
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Clear cart
 * @route  DELETE /api/cart
 * @access Private
 */
exports.clearCart = async (req, res) => {
  try {
    // Find cart for current user
    let cart = await Cart.findOne({ userId: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Clear cart items
    cart.items = [];
    cart.total = 0;
    
    // Save cart
    await cart.save();
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Update cart delivery fee and tip
 * @route  PUT /api/cart/details
 * @access Private
 */
exports.updateCartDetails = async (req, res) => {
  try {
    const { delivery, tip } = req.body;
    
    // Find cart for current user
    let cart = await Cart.findOne({ userId: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Update delivery info if provided
    if (delivery) {
      cart.delivery = {
        ...cart.delivery,
        ...delivery
      };
    }
    
    // Update tip info if provided
    if (tip) {
      cart.tip = {
        ...cart.tip,
        ...tip
      };
    }
    
    // Save cart
    await cart.save();
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error updating cart details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 