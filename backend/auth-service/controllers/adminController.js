const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');
const { getPermissionsForRole } = require('../utils/permissions');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * @desc    Create a new restaurant admin or delivery personnel account
 * @route   POST /api/admin/users
 * @access  Private/Admin
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, userType, address, firstName, lastName, password } = req.body;
    
    // Validate required fields
    if (!email || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and userType'
      });
    }
    
    // Prevent creating customer accounts through admin interface
    if (userType === 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Customer accounts cannot be created by admins. Customers should register through the public registration page.'
      });
    }
    
    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Prepare user data
    const userData = {
      email,
      userType,
      active: true,
      emailVerified: false,
      passwordChangeRequired: false,
      createdBy: req.user?.id // Track which admin created this user
    };
    
    // Handle name fields
    if (firstName && lastName) {
      userData.firstName = firstName;
      userData.lastName = lastName;
      userData.name = `${firstName} ${lastName}`;
    } else if (name) {
      // Try to split name into firstName and lastName
      const nameParts = name.split(' ');
      userData.firstName = nameParts[0] || 'Unknown';
      userData.lastName = nameParts.slice(1).join(' ') || 'User';
      userData.name = name;
    }
    
    // Add optional fields
    if (phone) userData.phone = phone;
    if (address) userData.address = address;
    
    // Handle password
    if (password) {
      userData.password = password; // Will be hashed by the model pre-save hook
    } else {
      // Generate a temporary random password
      const tempPassword = crypto.randomBytes(8).toString('hex');
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(tempPassword, salt);
      userData.passwordChangeRequired = true;
    }
    
    // Create the user
    const user = await User.create(userData);
    
    // Send back the user data (without the password)
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
          active: user.active
        },
        tempPassword: password ? undefined : tempPassword // Include temporary password in response only if we generated one
      },
      message: 'User created successfully.'
    });
    
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

/**
 * @desc    Get all users (with optional filtering)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res) => {
  try {
    const { userType, active, search } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Add userType filter if provided
    if (userType) {
      filter.userType = userType;
    }
    
    // Add active status filter if provided
    if (active !== undefined) {
      filter.active = active === 'true';
    }
    
    // Add search filter if provided
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Only exclude customers by default, but include all user types including admins
    if (!userType) {
      filter.userType = { $ne: 'customer' };
    }
    
    const users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 });
    
    // Map the response to match the frontend expectations
    const mappedUsers = users.map(user => ({
      id: user._id,
      name: user.name || `${user.firstName} ${user.lastName}`,
      email: user.email,
      userType: user.userType,
      active: user.active,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      createdAt: user.createdAt
    }));
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: mappedUsers
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire');
    
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
    console.error('Admin get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error.message
    });
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, active, address } = req.body;
    
    // Find user
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Build update object with only fields that were provided
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (active !== undefined) updateData.active = active;
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire');
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

/**
 * @desc    Reset user password
 * @route   PUT /api/admin/users/:id/reset-password
 * @access  Private/Admin
 */
exports.resetUserPassword = async (req, res) => {
  try {
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate a temporary random password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    
    // Update user with new password and require password change
    await User.findByIdAndUpdate(
      req.params.id,
      {
        password: hashedPassword,
        passwordChangeRequired: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: {
        tempPassword
      },
      message: 'Password reset successfully. User will need to change password on next login.'
    });
    
    // TODO: Send email with temporary password
    // This would be implemented with a notification service
    
  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent deleting admin users for safety
    if (user.userType === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }
    
    // Use findByIdAndDelete instead of user.remove()
    await User.findByIdAndDelete(user._id);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

/**
 * @desc    Get user statistics
 * @route   GET /api/admin/users/stats
 * @access  Private/Admin
 */
exports.getUserStats = async (req, res) => {
  try {
    // Get total count of all users
    const totalUsers = await User.countDocuments();
    
    // Get count of users by type
    const admins = await User.countDocuments({ userType: 'admin' });
    const restaurantAdmins = await User.countDocuments({ userType: 'restaurant-admin' });
    const deliveryPersonnel = await User.countDocuments({ userType: 'delivery-personnel' });
    const customers = await User.countDocuments({ userType: 'customer' });
    
    // Return statistics
    res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        admins,
        restaurantAdmins,
        deliveryPersonnel,
        customers
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user statistics',
      error: error.message
    });
  }
}; 