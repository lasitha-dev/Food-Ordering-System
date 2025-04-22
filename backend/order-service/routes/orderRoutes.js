const express = require('express');
const router = express.Router();
const { 
  getUserOrders, 
  getOrderById, 
  createOrder, 
  updateOrderPayment, 
  deleteOrder,
  getRestaurantOrders,
  updateOrderStatus,
  assignOrder,
  getAssignedOrders,
  updateDeliveryStatus
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

// Delivery personnel assigned orders route
router.get('/delivery/assigned', getAssignedOrders);

// Order detail routes
router.route('/:id')
  .get(getOrderById)
  .delete(deleteOrder);

// Order payment route
router.route('/:id/payment')
  .put(updateOrderPayment);

// Order status update route
router.route('/:id/status')
  .put(updateOrderStatus);

// Order assignment route
router.route('/:id/assign')
  .put(assignOrder);

// Delivery status update route
router.route('/:id/delivery-status')
  .put(updateDeliveryStatus);

module.exports = router; 