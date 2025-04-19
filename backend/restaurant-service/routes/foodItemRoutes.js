const express = require('express');
const router = express.Router();
const { 
  createFoodItem, 
  getFoodItems, 
  getFoodItemById, 
  updateFoodItem, 
  deleteFoodItem 
} = require('../controllers/foodItemController');
const { protect, restaurantAdmin } = require('../middleware/authMiddleware');

// Apply middleware to all routes
router.use(protect);
router.use(restaurantAdmin);

// Routes for /api/food-items
router.route('/')
  .post(createFoodItem)
  .get(getFoodItems);

// Routes for /api/food-items/:id
router.route('/:id')
  .get(getFoodItemById)
  .put(updateFoodItem)
  .delete(deleteFoodItem);

module.exports = router; 