const UserAddress = require('../models/UserAddress');

/**
 * @desc   Get all addresses for the current user
 * @route  GET /api/addresses
 * @access Private
 */
exports.getUserAddresses = async (req, res) => {
  try {
    // Find all addresses for current user
    const addresses = await UserAddress.find({ userId: req.user.id })
      .sort({ isDefault: -1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Get a single address by ID
 * @route  GET /api/addresses/:id
 * @access Private
 */
exports.getAddressById = async (req, res) => {
  try {
    const address = await UserAddress.findById(req.params.id);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // Only allow users to access their own addresses
    if (address.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this address'
      });
    }
    
    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Create a new address
 * @route  POST /api/addresses
 * @access Private
 */
exports.createAddress = async (req, res) => {
  try {
    const {
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phoneNumber,
      isDefault,
      label
    } = req.body;
    
    // Validate required fields
    if (!addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Create address
    const address = await UserAddress.create({
      userId: req.user.id,
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      state,
      postalCode,
      country: country || 'US',
      phoneNumber: phoneNumber || '',
      isDefault: isDefault === true,
      label: label || 'Home'
    });
    
    res.status(201).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Update an address
 * @route  PUT /api/addresses/:id
 * @access Private
 */
exports.updateAddress = async (req, res) => {
  try {
    let address = await UserAddress.findById(req.params.id);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // Only allow users to update their own addresses
    if (address.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this address'
      });
    }
    
    // Update address
    address = await UserAddress.findByIdAndUpdate(
      req.params.id,
      { ...req.body, userId: req.user.id }, // Ensure userId doesn't change
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Delete an address
 * @route  DELETE /api/addresses/:id
 * @access Private
 */
exports.deleteAddress = async (req, res) => {
  try {
    const address = await UserAddress.findById(req.params.id);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // Only allow users to delete their own addresses
    if (address.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this address'
      });
    }
    
    // Delete address
    await address.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc   Set an address as default
 * @route  PUT /api/addresses/:id/default
 * @access Private
 */
exports.setDefaultAddress = async (req, res) => {
  try {
    let address = await UserAddress.findById(req.params.id);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // Only allow users to update their own addresses
    if (address.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this address'
      });
    }
    
    // First, unset all other default addresses for this user
    await UserAddress.updateMany(
      { userId: req.user.id },
      { isDefault: false }
    );
    
    // Set this address as default
    address = await UserAddress.findByIdAndUpdate(
      req.params.id,
      { isDefault: true },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 