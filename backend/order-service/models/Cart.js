const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
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
  total: {
    type: Number,
    default: 0
  },
  delivery: {
    fee: {
      type: Number,
      default: 0
    },
    free: {
      type: Boolean,
      default: false
    }
  },
  tip: {
    amount: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
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

// Pre-save middleware to calculate the total price
CartSchema.pre('save', function(next) {
  // Calculate total based on items
  this.total = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // Update the updatedAt timestamp
  this.updatedAt = Date.now();
  
  next();
});

module.exports = mongoose.model('Cart', CartSchema); 