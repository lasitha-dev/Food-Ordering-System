// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const notificationRoutes = require('./routes/notificationRoutes');
const deliveryNotificationRoutes = require('./routes/deliveryNotificationRoutes');

// Initialize express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3006;

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

// Store socket.io instance in app
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  
  // Handle client joining user-specific room
  socket.on('joinUserRoom', (userId) => {
    if (userId) {
      console.log(`User ${userId} joined their notification room`);
      socket.join(userId.toString());
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

// Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/delivery-notifications', deliveryNotificationRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Notification Service is running'
  });
});

// Base route
app.get('/', (req, res) => {
  res.send('Notification Service is running!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
}); 