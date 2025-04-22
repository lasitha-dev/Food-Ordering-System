const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { generateTokenWithPermissions, verifyToken } = require('../utils/jwtUtils');
const { getPermissionsForRole } = require('../utils/permissions');
const { blacklistToken } = require('../utils/tokenBlacklist');
const mongoose = require('mongoose');

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

    console.log(`Login attempt for: ${email}`);

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log(`User found: ${email}, type: ${user.userType}, id: ${user._id}`);
    console.log(`Password hash stored for user: ${user.password.substring(0, 10)}...`);

    // Check if account is active
    if (!user.active) {
      console.log(`User account is not active: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Check if password matches
    console.log(`Attempting to match password for: ${email}`);
    
    // Fix for passwords that are not properly hashed (migration)
    if (user.password && (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$'))) {
      console.log(`Password for user ${email} appears to not be properly hashed. Fixing it...`);
      
      // If the password in DB is not hashed, compare directly
      const isDirectMatch = user.password === password;
      
      if (isDirectMatch) {
        console.log(`Direct password match successful for ${email}. Rehashing password...`);
        // Update the password to be properly hashed
        user.password = password; // Will be hashed by pre-save hook
        await user.save();
        console.log(`Password rehashed successfully for ${email}`);
      } else {
        console.log(`Direct password match failed for ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    }
    
    // Now try the normal password match
    const isMatch = await user.matchPassword(password);
    console.log(`Password match result for ${email}: ${isMatch}`);
    
    // Special case for seed admin account
    const isAdminSeed = (email === 'admin@fooddelivery.com' && password === 'Admin@123456');
    
    if (!isMatch && !isAdminSeed) {
      console.log(`Password does not match for user: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // If this is the admin seed account with the default password, fix the password hash
    if (isAdminSeed && !isMatch) {
      console.log('Admin seed account detected with default password. Updating password hash...');
      user.password = 'Admin@123456'; // Will be properly hashed by pre-save hook
      await user.save();
    }

    console.log(`Login successful for: ${email}`);

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

// @desc    Debug endpoint to ensure the admin account exists with the correct password
// @route   GET /api/auth/debug/ensure-admin
// @access  Public
exports.debugEnsureAdmin = async (req, res) => {
  try {
    // Check if admin account exists
    const adminEmail = 'admin@fooddelivery.com';
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log('Admin account exists. Ensuring password is correctly set...');
      
      // Reset the password directly (will be hashed by pre-save hook)
      admin.password = 'Admin@123456';
      admin.active = true;
      admin.emailVerified = true;
      admin.passwordChangeRequired = false;
      
      await admin.save();
      console.log('Admin password has been set to Admin@123456');
    } else {
      console.log('Admin account does not exist. Creating...');
      
      // Create admin account
      admin = await User.create({
        email: adminEmail,
        password: 'Admin@123456',
        firstName: 'System',
        lastName: 'Administrator',
        name: 'System Administrator',
        userType: 'admin',
        active: true,
        emailVerified: true,
        passwordChangeRequired: false
      });
      
      console.log('Admin account created successfully');
    }
    
    // Return success
    res.status(200).json({
      success: true,
      message: 'Admin account ensured with password: Admin@123456',
      adminEmail
    });
  } catch (error) {
    console.error('Debug ensure admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ensure admin account',
      error: error.message
    });
  }
};

// @desc    System initialization - reset all user passwords
// @route   GET /api/auth/debug/reset-all-passwords
// @access  Public (dev only)
exports.debugResetAllPasswords = async (req, res) => {
  try {
    // WARNING: This is a system recovery function for dev purposes only!
    const defaultPassword = 'Password123!';
    
    // Find all users
    const users = await User.find({});
    const results = [];
    
    for (const user of users) {
      console.log(`Resetting password for user: ${user.email}`);
      
      // Set the default password
      user.password = defaultPassword;
      user.passwordChangeRequired = true;
      
      await user.save();
      
      results.push({
        email: user.email,
        userType: user.userType,
        resetSuccess: true
      });
    }
    
    // Return results
    res.status(200).json({
      success: true,
      message: `Reset passwords for ${results.length} users to "${defaultPassword}" with passwordChangeRequired=true`,
      results
    });
  } catch (error) {
    console.error('Debug reset all passwords error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset passwords',
      error: error.message
    });
  }
};

// @desc    Debug endpoint to verify database connection
// @route   GET /api/auth/debug/check-db
// @access  Public
exports.debugCheckDatabase = async (req, res) => {
  try {
    // Check MongoDB connection and database configuration
    const dbInfo = {
      connectionString: process.env.MONGO_URI ? 'Set in environment' : 'Not set',
      databaseName: mongoose.connection.name || 'Not connected',
      collections: await mongoose.connection.db.collections().then(collections => 
        collections.map(c => c.collectionName)
      ),
      connectedToAtlas: process.env.MONGO_URI && process.env.MONGO_URI.includes('mongodb+srv'),
      connectionState: mongoose.connection.readyState
    };

    // Count users in the database
    const userCount = await User.countDocuments();
    
    // List some users for verification
    const sampleUsers = await User.find().limit(5).select('-password');
    
    // Return database info
    res.status(200).json({
      success: true,
      message: 'Database connection verified',
      data: {
        dbInfo,
        userCount,
        sampleUsers,
        mongooseVersion: mongoose.version,
        environmentInfo: {
          nodeEnv: process.env.NODE_ENV || 'Not set',
          port: process.env.PORT || '3001 (default)'
        }
      }
    });
  } catch (error) {
    console.error('Debug database check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify database connection',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};

// @desc    Debug endpoint to fix database issues
// @route   GET /api/auth/debug/fix-database
// @access  Public
exports.debugFixDatabase = async (req, res) => {
  try {
    // Check MongoDB connection string
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/food-delivery-auth';
    console.log(`Using MongoDB URI: ${mongoUri.replace(/:[^:]*@/, ':****@')}`); // Hide password
    
    // Don't need to reconnect since we're already connected via the Express app
    console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
    
    // Count users before fixes
    const initialUserCount = await User.countDocuments();
    console.log(`Found ${initialUserCount} users in database`);
    
    // Check for admin user
    let adminUser = await User.findOne({ email: 'admin@fooddelivery.com' }).select('+password');
    
    if (!adminUser) {
      console.log('Admin user not found. Creating default admin...');
      
      // Create admin user
      adminUser = await User.create({
        email: 'admin@fooddelivery.com',
        password: 'Admin@123456', // Will be hashed by pre-save hook
        firstName: 'System',
        lastName: 'Administrator',
        name: 'System Administrator',
        userType: 'admin',
        active: true,
        emailVerified: true,
        passwordChangeRequired: false
      });
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user exists. Ensuring password is set properly...');
      
      // Check if password is hashed
      if (!adminUser.password || (!adminUser.password.startsWith('$2a$') && !adminUser.password.startsWith('$2b$'))) {
        adminUser.password = 'Admin@123456';
        await adminUser.save();
        console.log('Admin password reset and properly hashed');
      } else {
        // Just reset password anyway to be sure
        adminUser.password = 'Admin@123456';
        await adminUser.save();
        console.log('Admin password reset to ensure it works');
      }
    }
    
    // Fix all users with unhashed passwords
    console.log('Finding users with potentially unhashed passwords...');
    const users = await User.find().select('+password');
    let fixedUsers = 0;
    
    for (const user of users) {
      // Skip users with no password (shouldn't happen)
      if (!user.password) {
        console.log(`User ${user.email} has no password. Setting a default password...`);
        user.password = 'Password123!';
        user.passwordChangeRequired = true;
        await user.save();
        fixedUsers++;
        continue;
      }
      
      // Check if password is not properly hashed
      if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        console.log(`User ${user.email} has unhashed password. Fixing...`);
        
        // Store original password
        const originalPassword = user.password;
        
        // Set a known password
        user.password = originalPassword || 'Password123!';
        user.passwordChangeRequired = true;
        await user.save();
        
        console.log(`Fixed password for ${user.email}`);
        fixedUsers++;
      }
    }
    
    // Create test users if requested
    let testUsersCreated = 0;
    if (req.query.createTestUsers === 'true') {
      console.log('Creating test users for each role...');
      
      const testUsers = [
        {
          email: 'restaurant@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'Restaurant',
          name: 'Test Restaurant',
          userType: 'restaurant-admin',
          active: true,
          emailVerified: true
        },
        {
          email: 'delivery@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'Delivery',
          name: 'Test Delivery',
          userType: 'delivery-personnel',
          active: true,
          emailVerified: true
        },
        {
          email: 'customer@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'Customer',
          name: 'Test Customer',
          userType: 'customer',
          active: true,
          emailVerified: true
        }
      ];
      
      for (const userData of testUsers) {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`Test user ${userData.email} already exists. Updating password...`);
          existingUser.password = userData.password;
          await existingUser.save();
        } else {
          console.log(`Creating test user: ${userData.email}`);
          await User.create(userData);
          testUsersCreated++;
        }
      }
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Database fix completed',
      data: {
        databaseName: mongoose.connection.name,
        initialUserCount,
        fixedUsers,
        testUsersCreated,
        finalUserCount: await User.countDocuments(),
        adminCredentials: {
          email: 'admin@fooddelivery.com',
          password: 'Admin@123456'
        },
        testUserCredentials: req.query.createTestUsers === 'true' ? {
          restaurantAdmin: {
            email: 'restaurant@test.com',
            password: 'Password123!'
          },
          deliveryPersonnel: {
            email: 'delivery@test.com',
            password: 'Password123!'
          },
          customer: {
            email: 'customer@test.com',
            password: 'Password123!'
          }
        } : null
      }
    });
  } catch (error) {
    console.error('Error fixing database issues:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fixing database issues',
      error: error.message
    });
  }
}; 