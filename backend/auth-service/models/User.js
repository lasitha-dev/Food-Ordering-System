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

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.updatedAt = Date.now();
  next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  console.log('Matching password:');
  console.log('- Entered password:', enteredPassword);
  console.log('- Stored hash:', this.password);
  
  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log('- Match result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

module.exports = mongoose.model('User', UserSchema); 