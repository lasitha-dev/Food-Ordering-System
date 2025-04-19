require('dotenv').config();
const express = require('express');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.send('Delivery Service is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Delivery Service running on port ${PORT}`);
}); 