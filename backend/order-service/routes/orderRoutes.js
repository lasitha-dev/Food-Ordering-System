const express = require('express');
const router = express.Router();
const { 
  getUserOrders, 
  getOrderById, 
  createOrder, 
  updateOrderPayment, 
  deleteOrder 
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Order routes
router.route('/')
  .get(getUserOrders)
  .post(createOrder);

router.route('/:id')
  .get(getOrderById)
  .delete(deleteOrder);

router.route('/:id/payment')
  .put(updateOrderPayment);

module.exports = router; 