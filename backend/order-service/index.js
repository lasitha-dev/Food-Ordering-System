require('dotenv').config();
const express = require('express');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.send('Order Service is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
}); 