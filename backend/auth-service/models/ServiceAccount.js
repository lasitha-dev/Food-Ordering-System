const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const ServiceAccountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the service account'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  clientId: {
    type: String,
    unique: true,
    required: true
  },
  clientSecret: {
    type: String,
    required: true,
    select: false // Don't return by default in queries
  },
  serviceName: {
    type: String,
    required: [true, 'Please provide the service name'],
    enum: [
      'restaurant-service',
      'order-service',
      'delivery-service',
      'payment-service',
      'notification-service',
      'api-gateway'
    ]
  },
  scopes: {
    type: [String],
    required: true,
    default: []
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUsed: {
    type: Date,
    default: null
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

// Generate client ID and secret before saving
ServiceAccountSchema.pre('save', async function(next) {
  // Only hash the client secret if it's modified (or new)
  if (!this.isModified('clientSecret') && this.clientId) {
    return next();
  }

  try {
    // Generate client ID if not present
    if (!this.clientId) {
      this.clientId = `svc_${crypto.randomBytes(16).toString('hex')}`;
    }

    // Generate client secret if not present
    if (!this.clientSecret) {
      const secret = crypto.randomBytes(32).toString('hex');
      
      // Hash the client secret before saving
      const salt = await bcrypt.genSalt(10);
      this.clientSecret = await bcrypt.hash(secret, salt);
      
      // Temporarily store the plain secret so it can be returned after save
      this._plainSecret = secret;
    }

    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare client secret
ServiceAccountSchema.methods.compareSecret = async function(enteredSecret) {
  return await bcrypt.compare(enteredSecret, this.clientSecret);
};

// Create a method to generate a new client secret
ServiceAccountSchema.methods.generateNewSecret = async function() {
  const secret = crypto.randomBytes(32).toString('hex');
  
  // Hash the client secret before saving
  const salt = await bcrypt.genSalt(10);
  this.clientSecret = await bcrypt.hash(secret, salt);
  
  // Store the plain secret
  this._plainSecret = secret;
  
  // Update timestamps
  this.updatedAt = Date.now();
  
  // Save the document
  await this.save();
  
  // Return the plain secret
  return secret;
};

// Create service account with initial client ID and secret
ServiceAccountSchema.statics.createServiceAccount = async function(data) {
  // Generate initial client secret
  const secret = crypto.randomBytes(32).toString('hex');
  
  // Create the service account with hashed secret
  const serviceAccount = await this.create({
    ...data,
    clientId: `svc_${crypto.randomBytes(16).toString('hex')}`,
    clientSecret: secret // Will be hashed in pre-save hook
  });
  
  // Return the service account with plain secret
  return {
    serviceAccount,
    clientSecret: serviceAccount._plainSecret
  };
};

module.exports = mongoose.model('ServiceAccount', ServiceAccountSchema); 