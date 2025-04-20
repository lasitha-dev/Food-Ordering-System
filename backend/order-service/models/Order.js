const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  items: [
    {
      _id: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      image: {
        type: String
      },
      categoryId: {
        type: String
      }
    }
  ],
  subtotal: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  tip: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  additionalInstructions: {
    type: String
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['card', 'cash']
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'paid', 'refunded', 'failed'],
    default: 'unpaid'
  },
  paymentId: {
    type: String
  },
  paymentDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Placed'
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
OrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', OrderSchema); 