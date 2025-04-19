const bcrypt = require('bcryptjs');

async function testBcrypt() {
  try {
    console.log('Testing bcrypt directly...');
    
    // Generate salt and hash
    const salt = await bcrypt.genSalt(10);
    console.log('Salt:', salt);
    
    const plainPassword = 'Admin@123456';
    console.log('Plain password:', plainPassword);
    
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    console.log('Hashed password:', hashedPassword);
    
    // Compare password
    const isMatch1 = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('Is matching (same variables):', isMatch1);
    
    // Test with literal strings
    const isMatch2 = await bcrypt.compare('Admin@123456', hashedPassword);
    console.log('Is matching (string literal):', isMatch2);
    
    // Test with a completely new hash
    const newHash = await bcrypt.hash('Admin@123456', salt);
    console.log('New hash:', newHash);
    
    const isMatch3 = await bcrypt.compare('Admin@123456', newHash);
    console.log('Is matching (new hash):', isMatch3);
  } catch (error) {
    console.error('Error:', error);
  }
}

testBcrypt(); 