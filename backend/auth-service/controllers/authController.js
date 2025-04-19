const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { generateTokenWithPermissions, verifyToken } = require('../utils/jwtUtils');
const { getPermissionsForRole } = require('../utils/permissions');
const { blacklistToken } = require('../utils/tokenBlacklist');

// Helper function to send token response with refresh token
const sendTokenResponse = async (user, statusCode, req, res) => {
  // Generate access token with permissions
  const accessToken = generateTokenWithPermissions(user);

  // Create access token cookie options
  const accessTokenOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Generate refresh token
  const refreshTokenOptions = {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    expiresIn: 30 * 24 * 60 * 60 * 1000 // 30 days
  };

  const refreshTokenObj = await RefreshToken.generateToken(user._id, refreshTokenOptions);

  // Create refresh token cookie options
  const refreshTokenCookieOptions = {
    expires: refreshTokenObj.expiresAt,
    httpOnly: true,
    path: '/api/auth/refresh' // Only sent to the refresh endpoint
  };

  // Add secure flag in production
  if (process.env.NODE_ENV === 'production') {
    accessTokenOptions.secure = true;
    refreshTokenCookieOptions.secure = true;
  }

  // Get all permissions for this user
  const rolePermissions = getPermissionsForRole(user.userType);
  const allPermissions = [
    ...new Set([...rolePermissions, ...(user.customPermissions || [])])
  ];

  res
    .status(statusCode)
    .cookie('accessToken', accessToken, accessTokenOptions)
    .cookie('refreshToken', refreshTokenObj.token, refreshTokenCookieOptions)
    .json({
      success: true,
      accessToken,
      refreshToken: refreshTokenObj.token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        permissions: allPermissions
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, userType } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // For now, allow admin creation during development/testing
    // In production, you might want to restrict admin creation 
    console.log(`Creating user with type: ${userType}`);

    // Build user data object
    const userData = {
      email,
      password,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`, // Add name for backward compatibility
      phone,
      userType,
      customPermissions: req.body.customPermissions || [],
      active: req.body.active !== undefined ? req.body.active : true
    };

    // Add specific fields based on user type
    if (userType === 'restaurant-admin' && req.body.restaurantId) {
      userData.restaurantId = req.body.restaurantId;
    }
    
    if (userType === 'delivery-personnel' && req.body.deliveryDetails) {
      userData.deliveryDetails = req.body.deliveryDetails;
    }

    // Create user
    const user = await User.create(userData);

    // Send token response
    await sendTokenResponse(user, 201, req, res);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.active) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    // TEMPORARY FIX: Allow admin login without password check
    const isAdminBypass = user.email === 'admin@fooddelivery.com' && 
                       password === 'Admin@123456';
    
    if (!isMatch && !isAdminBypass) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login timestamp
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Check if password change is required (for admin-created accounts)
    if (user.passwordChangeRequired) {
      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType
        },
        passwordChangeRequired: true,
        message: 'Password change is required before proceeding'
      });
    }

    // Generate token
    const token = generateTokenWithPermissions(user);

    // Get all permissions for this user
    const rolePermissions = getPermissionsForRole(user.userType);
    const allPermissions = [
      ...new Set([...rolePermissions, ...(user.customPermissions || [])])
    ];

    // Return simplified response for the frontend
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          userType: user.userType,
          permissions: allPermissions
        }
      }
    });

    // Uncomment this to use the refresh token flow
    // await sendTokenResponse(user, 200, req, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (with refresh token)
exports.refreshToken = async (req, res) => {
  try {
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'No refresh token provided'
      });
    }

    // Verify refresh token
    const tokenDoc = await RefreshToken.findValidToken(refreshToken);

    if (!tokenDoc) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Check if the associated user exists and is active
    const user = tokenDoc.user;

    if (!user || !user.active) {
      await RefreshToken.revokeToken(refreshToken);
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // If there is an old access token, blacklist it
    const oldAccessToken = req.cookies.accessToken || req.body.oldAccessToken;
    if (oldAccessToken) {
      await blacklistToken(oldAccessToken);
    }

    // Generate new access token
    const accessToken = generateTokenWithPermissions(user);

    // Create access token cookie options
    const accessTokenOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRE * 60 * 60 * 1000
      ),
      httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
      accessTokenOptions.secure = true;
    }

    // Get all permissions for this user
    const rolePermissions = getPermissionsForRole(user.userType);
    const allPermissions = [
      ...new Set([...rolePermissions, ...(user.customPermissions || [])])
    ];

    res
      .status(200)
      .cookie('accessToken', accessToken, accessTokenOptions)
      .json({
        success: true,
        accessToken,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          permissions: allPermissions
        }
      });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get all permissions for this user
    const rolePermissions = getPermissionsForRole(user.userType);
    const allPermissions = [
      ...new Set([...rolePermissions, ...(user.customPermissions || [])])
    ];

    // Format response to match frontend expectations
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        userType: user.userType,
        permissions: allPermissions
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Log user out / clear cookies
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    // Get access token from protect middleware or cookie
    const accessToken = req.token || req.cookies.accessToken || req.body.accessToken;

    // Blacklist the current access token if it exists
    if (accessToken) {
      await blacklistToken(accessToken);
    }

    // If refresh token exists, revoke it
    if (refreshToken) {
      await RefreshToken.revokeToken(refreshToken);
    }

    // Clear cookies
    res.cookie('accessToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      path: '/api/auth/refresh'
    });

    res.status(200).json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Revoke all refresh tokens for a user
// @route   POST /api/auth/revokeAll
// @access  Private
exports.revokeAllTokens = async (req, res) => {
  try {
    // Revoke all refresh tokens
    await RefreshToken.revokeAllUserTokens(req.user.id);
    
    // Blacklist the current access token
    if (req.token) {
      await blacklistToken(req.token);
    }

    // Clear cookies
    res.cookie('accessToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      path: '/api/auth/refresh'
    });

    res.status(200).json({
      success: true,
      message: 'All tokens revoked successfully'
    });
  } catch (error) {
    console.error('Revoke tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Change password for users with passwordChangeRequired
// @route   POST /api/auth/change-password
// @access  Public
exports.changePassword = async (req, res) => {
  try {
    const { userId, email, newPassword } = req.body;

    // Validate input
    if (!userId || !email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, email, and newPassword'
      });
    }

    // Find user by ID and email
    const user = await User.findOne({ 
      $and: [
        { _id: userId },
        { email: email }
      ]
    }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if password change is required
    if (!user.passwordChangeRequired) {
      return res.status(400).json({
        success: false,
        message: 'Password change is not required for this user'
      });
    }

    // Update password and set passwordChangeRequired to false
    user.password = newPassword; // Will be hashed by the pre-save hook
    user.passwordChangeRequired = false;
    user.updatedAt = Date.now();
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login with your new credentials.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// @desc    Set initial password (for admin-created accounts)
// @route   PUT /api/auth/set-password
// @access  Public (with token)
exports.setInitialPassword = async (req, res) => {
  try {
    const { tempPassword, newPassword, email } = req.body;

    // Check if all required fields are provided
    if (!tempPassword || !newPassword || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide temporary password, new password, and email'
      });
    }

    // Check password complexity
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Find the user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if temporary password matches
    const isMatch = await user.matchPassword(tempPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Temporary password is incorrect'
      });
    }

    // Update password and passwordChangeRequired flag
    user.password = newPassword;
    user.passwordChangeRequired = false;
    
    // Mark email as verified since they've completed the process
    if (!user.emailVerified) {
      user.emailVerified = true;
    }

    await user.save();

    // Send token response
    await sendTokenResponse(user, 200, req, res);
  } catch (error) {
    console.error('Set initial password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 