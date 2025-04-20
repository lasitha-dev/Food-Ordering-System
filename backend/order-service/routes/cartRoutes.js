const express = require('express');
const router = express.Router();
const { 
  getUserCart, 
  addItemToCart, 
  updateCartItem, 
  removeCartItem, 
  clearCart,
  updateCartDetails
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Cart routes
router.route('/')
  .get(getUserCart)
  .delete(clearCart);

router.route('/items')
  .post(addItemToCart);

router.route('/items/:itemId')
  .put(updateCartItem)
  .delete(removeCartItem);

router.route('/details')
  .put(updateCartDetails);

module.exports = router; 