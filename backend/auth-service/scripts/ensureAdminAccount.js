require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function ensureAdminAccount() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/food-delivery-auth');
    console.log('Connected to MongoDB');

    // Check if admin account exists
    const adminEmail = 'admin@fooddelivery.com';
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log('Admin account exists. Ensuring password is correctly set...');
      
      // Reset the password to default
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123456', salt);
      
      admin.password = hashedPassword;
      admin.active = true;
      admin.emailVerified = true;
      admin.passwordChangeRequired = false;
      
      await admin.save({ validateBeforeSave: false });
      console.log('Admin password has been reset to Admin@123456');
    } else {
      console.log('Admin account does not exist. Creating...');
      
      // Create admin account
      admin = await User.create({
        email: adminEmail,
        password: 'Admin@123456',
        firstName: 'System',
        lastName: 'Administrator',
        name: 'System Administrator',
        userType: 'admin',
        active: true,
        emailVerified: true,
        passwordChangeRequired: false
      });
      
      console.log('Admin account created successfully');
    }
    
    // Verify account details
    const adminAccount = await User.findOne({ email: adminEmail }).select('-password');
    console.log('Admin account details:', adminAccount);
    
    console.log('Script completed successfully');
  } catch (error) {
    console.error('Error ensuring admin account:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
ensureAdminAccount(); 