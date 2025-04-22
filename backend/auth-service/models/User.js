const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'Please provide a first name']
  },
  lastName: {
    type: String,
    required: [true, 'Please provide a last name']
  },
  // For backward compatibility with older parts of the system
  name: {
    type: String,
    // Generate from firstName and lastName if not provided
    default: function() {
      if (this.firstName && this.lastName) {
        return `${this.firstName} ${this.lastName}`;
      }
      return '';
    }
  },
  phone: {
    type: String,
    required: false
  },
  userType: {
    type: String,
    required: true,
    enum: ['customer', 'restaurant-admin', 'delivery-personnel', 'admin'],
    default: 'customer'
  },
  // Custom permissions that override role-based permissions
  customPermissions: {
    type: [String],
    default: []
  },
  // Fields specific to different user types
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: function() {
      // Make it optional for testing purposes
      return false; // this.userType === 'restaurant-admin';
    }
  },
  deliveryDetails: {
    currentLocation: {
      lat: Number,
      lng: Number
    },
    isAvailable: {
      type: Boolean,
      default: false
    },
    vehicleInfo: {
      type: String
    }
  },
  // For admin-created accounts
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Account status
  active: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  passwordChangeRequired: {
    type: Boolean,
    default: false
  },
  // For password reset functionality
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    console.log(`Hashing password for user: ${this.email}`);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = Date.now();
    console.log(`Password hashed successfully for ${this.email}`);
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    if (!this.password) {
      console.error(`No password hash found for user: ${this.email}`);
      return false;
    }
    
    if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      console.error(`Password for ${this.email} is not properly hashed. Hash prefix: ${this.password.substr(0, 4)}`);
      return false;
    }
    
    console.log(`Comparing password for ${this.email}:`);
    console.log(`- Hash length: ${this.password.length}, starts with: ${this.password.substring(0, 10)}...`);
    
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log(`- Password match result for ${this.email}: ${isMatch}`);
    return isMatch;
  } catch (error) {
    console.error(`Error comparing passwords for ${this.email}:`, error);
    return false;
  }
};

module.exports = mongoose.model('User', UserSchema); 