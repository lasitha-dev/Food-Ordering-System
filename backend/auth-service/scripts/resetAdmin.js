require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const resetAdmin = async () => {
  try {
    await connectDB();
    
    console.log('Deleting existing admin user...');
    await User.deleteOne({ email: 'admin@fooddelivery.com' });
    
    console.log('Creating new admin user...');
    
    // Create new admin with direct password hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123456', salt);
    
    const newAdmin = await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@fooddelivery.com',
      password: hashedPassword,
      userType: 'admin',
      active: true,
      emailVerified: true,
      passwordChangeRequired: false
    });
    
    console.log('Created new admin user:');
    console.log('- ID:', newAdmin._id);
    console.log('- Email:', newAdmin.email);
    
    // Test password matching
    const admin = await User.findOne({ email: 'admin@fooddelivery.com' }).select('+password');
    console.log('- Password Hash:', admin.password);
    
    const isPasswordValid = await admin.matchPassword('Admin@123456');
    console.log('- Password Valid (using method):', isPasswordValid);
    
    const isValidDirect = await bcrypt.compare('Admin@123456', admin.password);
    console.log('- Password Valid (direct):', isValidDirect);
    
    console.log('\n=======================');
    console.log('ADMIN LOGIN CREDENTIALS');
    console.log('=======================');
    console.log('Email: admin@fooddelivery.com');
    console.log('Password: Admin@123456');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetAdmin(); 