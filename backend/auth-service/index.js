require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const serviceAuthRoutes = require('./routes/serviceAuthRoutes');
const serviceAccountRoutes = require('./routes/serviceAccountRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Connect to database
connectDB();

// Connect to Redis (for token blacklisting)
connectRedis().catch(err => {
  console.warn('Redis connection failed:', err.message);
  console.log('Continuing without Redis. Token blacklisting will be disabled.');
});

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/service-auth', serviceAuthRoutes);
app.use('/api/service-accounts', serviceAccountRoutes);
app.use('/api/admin', adminRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Auth Service is running!');
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
  console.log(`Auth Service running on port ${PORT}`);
}); 