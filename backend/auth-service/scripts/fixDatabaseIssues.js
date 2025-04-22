require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * This script fixes several potential issues with the MongoDB connection and user data:
 * 
 * 1. Ensures proper connection to the database
 * 2. Verifies all passwords are properly hashed
 * 3. Updates any inconsistent user records
 * 4. Creates a default admin user if needed
 */
async function fixDatabaseIssues() {
  try {
    console.log('Starting database fix script...');
    
    // Check MongoDB connection string
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/food-delivery-auth';
    console.log(`Using MongoDB URI: ${mongoUri.replace(/:[^:]*@/, ':****@')}`); // Hide password
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
    
    // Check for collections
    const collections = await mongoose.connection.db.collections();
    console.log(`Found ${collections.length} collections: ${collections.map(c => c.collectionName).join(', ')}`);
    
    // Count users before fixes
    const initialUserCount = await User.countDocuments();
    console.log(`Found ${initialUserCount} users in database`);
    
    // Check for admin user
    let adminUser = await User.findOne({ email: 'admin@fooddelivery.com' });
    
    if (!adminUser) {
      console.log('Admin user not found. Creating default admin...');
      
      // Create admin user
      adminUser = await User.create({
        email: 'admin@fooddelivery.com',
        password: 'Admin@123456', // Will be hashed by pre-save hook
        firstName: 'System',
        lastName: 'Administrator',
        name: 'System Administrator',
        userType: 'admin',
        active: true,
        emailVerified: true,
        passwordChangeRequired: false
      });
      
      console.log('Admin user created successfully with email: admin@fooddelivery.com and password: Admin@123456');
    } else {
      console.log('Admin user exists. Ensuring password is set properly...');
      
      // Check if password is hashed
      if (!adminUser.password || (!adminUser.password.startsWith('$2a$') && !adminUser.password.startsWith('$2b$'))) {
        adminUser.password = 'Admin@123456';
        await adminUser.save();
        console.log('Admin password reset and properly hashed');
      } else {
        // Just reset password anyway to be sure
        adminUser.password = 'Admin@123456';
        await adminUser.save();
        console.log('Admin password reset to ensure it works: Admin@123456');
      }
    }
    
    // Fix all users with unhashed passwords
    console.log('Finding users with potentially unhashed passwords...');
    const users = await User.find().select('+password');
    let fixedUsers = 0;
    
    for (const user of users) {
      // Skip users with no password (shouldn't happen)
      if (!user.password) {
        console.log(`User ${user.email} has no password. Setting a default password...`);
        user.password = 'Password123!';
        user.passwordChangeRequired = true;
        await user.save();
        fixedUsers++;
        continue;
      }
      
      // Check if password is not properly hashed
      if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        console.log(`User ${user.email} has unhashed password. Fixing...`);
        
        // Store original password
        const originalPassword = user.password;
        
        // Set a known password
        user.password = originalPassword || 'Password123!';
        user.passwordChangeRequired = true;
        await user.save();
        
        console.log(`Fixed password for ${user.email}`);
        fixedUsers++;
      }
    }
    
    console.log(`Fixed ${fixedUsers} user accounts with password issues`);
    
    // Create a test user of each type if requested
    if (process.env.CREATE_TEST_USERS === 'true') {
      console.log('Creating test users for each role...');
      
      const testUsers = [
        {
          email: 'restaurant@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'Restaurant',
          userType: 'restaurant-admin'
        },
        {
          email: 'delivery@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'Delivery',
          userType: 'delivery-personnel'
        },
        {
          email: 'customer@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'Customer',
          userType: 'customer'
        }
      ];
      
      for (const userData of testUsers) {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`Test user ${userData.email} already exists. Updating password...`);
          existingUser.password = userData.password;
          await existingUser.save();
        } else {
          console.log(`Creating test user: ${userData.email}`);
          await User.create(userData);
        }
      }
      
      console.log('Test users created or updated with password: Password123!');
    }
    
    // Verify users after fixes
    const finalUserCount = await User.countDocuments();
    console.log(`Database now has ${finalUserCount} users`);
    
    console.log('Script completed successfully!');
  } catch (error) {
    console.error('Error fixing database issues:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
fixDatabaseIssues(); 