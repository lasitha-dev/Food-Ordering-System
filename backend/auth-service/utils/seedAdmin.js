const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Seeds the initial admin user if no admin exists in the system
 */
const seedAdmin = async () => {
  try {
    console.log('Checking for existing admin user...');
    
    // Check if admin user already exists
    const adminExists = await User.findOne({ userType: 'admin' });
    
    if (!adminExists) {
      console.log('No admin user found. Creating default admin...');
      
      // Default admin credentials - these should be changed after first login
      const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@fooddelivery.com';
      const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456';
      
      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultAdminPassword, salt);
      
      const admin = await User.create({
        firstName: 'System',
        lastName: 'Administrator',
        name: 'System Administrator', // For backward compatibility
        email: defaultAdminEmail,
        password: hashedPassword,
        userType: 'admin',
        active: true,
        emailVerified: true
      });
      
      console.log(`Admin user created with email: ${defaultAdminEmail}`);
      console.log('IMPORTANT: Please change the default password after first login!');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

module.exports = seedAdmin; 