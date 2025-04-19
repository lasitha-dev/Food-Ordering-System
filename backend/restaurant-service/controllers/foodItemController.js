const FoodItem = require('../models/FoodItem');

// @desc    Create a new food item
// @route   POST /api/food-items
// @access  Private (Restaurant Admin)
const createFoodItem = async (req, res) => {
  try {
    const { title, description, category, imageUrl } = req.body;
    
    // Create new food item
    const foodItem = await FoodItem.create({
      title,
      description,
      category,
      imageUrl: imageUrl || '',
      createdBy: req.user.id // User ID from auth middleware
    });
    
    res.status(201).json({
      success: true,
      data: foodItem
    });
  } catch (error) {
    console.error('Error creating food item:', error.message);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all food items created by the authenticated restaurant admin
// @route   GET /api/food-items
// @access  Private (Restaurant Admin)
const getFoodItems = async (req, res) => {
  try {
    // Find all food items created by the authenticated user
    const foodItems = await FoodItem.find({ createdBy: req.user.id });
    
    res.status(200).json({
      success: true,
      count: foodItems.length,
      data: foodItems
    });
  } catch (error) {
    console.error('Error getting food items:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get a single food item by ID
// @route   GET /api/food-items/:id
// @access  Private (Restaurant Admin)
const getFoodItemById = async (req, res) => {
  try {
    console.log('Getting food item by ID:', req.params.id);
    console.log('User ID from token:', req.user.id);
    
    const foodItem = await FoodItem.findById(req.params.id);
    
    if (!foodItem) {
      console.log('Food item not found');
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }
    
    console.log('Food item found:', foodItem);
    
    // Check if food item belongs to the authenticated user
    // Only apply this check in production, for debugging purposes leave it out temporarily
    // if (foodItem.createdBy.toString() !== req.user.id) {
    //   console.log('User not authorized, item belongs to:', foodItem.createdBy);
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to access this food item'
    //   });
    // }
    
    res.status(200).json({
      success: true,
      data: foodItem
    });
  } catch (error) {
    console.error('Error getting food item:', error.message);
    
    // Handle MongoDB validation errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update a food item
// @route   PUT /api/food-items/:id
// @access  Private (Restaurant Admin)
const updateFoodItem = async (req, res) => {
  try {
    console.log('Updating food item:', req.params.id);
    console.log('Update data:', req.body);
    
    let foodItem = await FoodItem.findById(req.params.id);
    
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }
    
    // Check if food item belongs to the authenticated user
    // Temporarily disable this check for debugging
    // if (foodItem.createdBy.toString() !== req.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to update this food item'
    //   });
    // }
    
    // Update food item
    foodItem = await FoodItem.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    
    console.log('Food item updated successfully:', foodItem);
    
    res.status(200).json({
      success: true,
      data: foodItem
    });
  } catch (error) {
    console.error('Error updating food item:', error.message);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    // Handle invalid ID format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete a food item
// @route   DELETE /api/food-items/:id
// @access  Private (Restaurant Admin)
const deleteFoodItem = async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);
    
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }
    
    // Check if food item belongs to the authenticated user
    if (foodItem.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this food item'
      });
    }
    
    await FoodItem.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting food item:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

module.exports = {
  createFoodItem,
  getFoodItems,
  getFoodItemById,
  updateFoodItem,
  deleteFoodItem
}; 