const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Food item title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Food item description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Food category is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Food item price is required'],
    min: [0, 'Price cannot be negative']
  },
  imageUrl: {
    type: String,
    required: false,
    default: '',
    trim: true
  },
  createdBy: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

const FoodItem = mongoose.model('FoodItem', foodItemSchema);

module.exports = FoodItem; 