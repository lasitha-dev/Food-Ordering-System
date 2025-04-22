require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createRestaurantAdmin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/food-delivery-auth');
    console.log('Connected to MongoDB');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'sunil@gmail.com' });
    
    if (existingUser) {
      console.log('Restaurant admin already exists:', existingUser.email);
      console.log('Updating password...');
      
      // Update the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Sunil1998!', salt);
      
      existingUser.password = hashedPassword;
      await existingUser.save();
      
      console.log('Password updated successfully!');
    } else {
      console.log('Creating restaurant admin user...');
      
      // Create the restaurant admin user
      const restaurantAdmin = new User({
        email: 'sunil@gmail.com',
        password: 'Sunil1998!',
        firstName: 'Sunil',
        lastName: 'Kumar',
        userType: 'restaurant-admin',
        active: true
      });
      
      await restaurantAdmin.save();
      console.log('Restaurant admin created successfully!');
    }
    
    // Display all users for verification
    const allUsers = await User.find({}).select('-password');
    console.log('All users in database:');
    console.log(JSON.stringify(allUsers, null, 2));
    
    console.log('Script completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
createRestaurantAdmin(); 