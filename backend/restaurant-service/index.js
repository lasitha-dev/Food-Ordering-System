require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const foodItemRoutes = require('./routes/foodItemRoutes');
const debugRoutes = require('./routes/debugRoutes');

// Connect to MongoDB
connectDB();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use('/api/food-items', foodItemRoutes);
app.use('/api/debug', debugRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Restaurant Service is running!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Restaurant Service running on port ${PORT}`);
}); 