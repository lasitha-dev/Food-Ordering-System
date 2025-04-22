const User = require('../models/User');
const { PERMISSIONS } = require('../utils/permissions');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get restaurant admins
// @route   GET /api/users/restaurant-admins
// @access  Private/Admin
exports.getRestaurantAdmins = async (req, res) => {
  try {
    const users = await User.find({ userType: 'restaurant-admin' });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get restaurant admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all delivery personnel
// @route   GET /api/users/delivery-personnel
// @access  Private - Users with delivery:read permission (Admin & Restaurant Admin)
exports.getDeliveryPersonnel = async (req, res) => {
  try {
    const users = await User.find({ userType: 'delivery-personnel' });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get delivery personnel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user permissions
// @route   PUT /api/users/:id/permissions
// @access  Private/Admin
exports.updateUserPermissions = async (req, res) => {
  try {
    // Validate custom permissions
    const { customPermissions } = req.body;
    
    if (!customPermissions || !Array.isArray(customPermissions)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of custom permissions'
      });
    }
    
    // Validate that all provided permissions are valid
    const allPermissions = Object.values(PERMISSIONS);
    const invalidPermissions = customPermissions.filter(
      permission => !allPermissions.includes(permission)
    );
    
    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid permissions provided: ${invalidPermissions.join(', ')}`
      });
    }
    
    // Update user permissions
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { customPermissions },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Enable/disable user account
// @route   PUT /api/users/:id/activate
// @access  Private/Admin
exports.setUserActiveStatus = async (req, res) => {
  try {
    const { active } = req.body;
    
    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Active status must be a boolean'
      });
    }
    
    // Update user active status
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Set active status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 