const express = require('express');
const { 
  getFoodItems,
  getFoodItemById,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  getPublicFoodItems
} = require('../controllers/foodItemController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/public', getPublicFoodItems);

// Protected routes - Restaurant Admin only
router.get('/', protect, authorize('restaurant-admin'), getFoodItems);
router.get('/:id', protect, authorize('restaurant-admin'), getFoodItemById);
router.post('/', protect, authorize('restaurant-admin'), createFoodItem);
router.put('/:id', protect, authorize('restaurant-admin'), updateFoodItem);
router.delete('/:id', protect, authorize('restaurant-admin'), deleteFoodItem);

module.exports = router; 