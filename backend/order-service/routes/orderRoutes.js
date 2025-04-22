const express = require('express');
const router = express.Router();
const { 
  getUserOrders, 
  getOrderById, 
  createOrder, 
  updateOrderPayment, 
  deleteOrder,
  getRestaurantOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Order routes
router.route('/')
  .get(getUserOrders)
  .post(createOrder);

// Restaurant orders route
router.get('/restaurant', getRestaurantOrders);

router.route('/:id')
  .get(getOrderById)
  .delete(deleteOrder);

router.route('/:id/payment')
  .put(updateOrderPayment);

// Route to update order status
router.route('/:id/status')
  .put(updateOrderStatus);

module.exports = router; 