const mongoose = require('mongoose');

const UserAddressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  addressLine1: {
    type: String,
    required: true
  },
  addressLine2: {
    type: String
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'US'
  },
  phoneNumber: {
    type: String
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    enum: ['Home', 'Work', 'Other'],
    default: 'Home'
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

// Update timestamp when modified
UserAddressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// If this address is set as default, make sure no other address for this user is default
UserAddressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    try {
      await this.constructor.updateMany(
        { userId: this.userId, _id: { $ne: this._id } },
        { $set: { isDefault: false } }
      );
    } catch (error) {
      console.error('Error updating other addresses:', error);
    }
  }
  next();
});

module.exports = mongoose.model('UserAddress', UserAddressSchema); 