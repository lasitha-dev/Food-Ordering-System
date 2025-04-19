const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // After successful connection, seed the admin user
    try {
      const seedAdmin = require('../utils/seedAdmin');
      await seedAdmin();
    } catch (adminSeedError) {
      console.warn('Warning: Failed to seed admin user:', adminSeedError.message);
    }
    
    // After successful connection, seed the service accounts
    try {
      // Dynamically import seedServiceAccounts to avoid circular dependency issues
      const seedServiceAccounts = require('../utils/seedServiceAccounts');
      await seedServiceAccounts();
    } catch (seedError) {
      console.warn('Warning: Failed to seed service accounts:', seedError.message);
      console.log('You may need to manually create service accounts');
    }
    
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 