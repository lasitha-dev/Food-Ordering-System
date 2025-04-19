const ServiceAccount = require('../models/ServiceAccount');
const { getDefaultScopesForService } = require('./serviceScopes');

/**
 * Seeds the initial service accounts for each microservice if they don't exist
 */
const seedServiceAccounts = async () => {
  try {
    console.log('Checking for existing service accounts...');
    
    const serviceNames = [
      'api-gateway',
      'restaurant-service',
      'order-service', 
      'delivery-service',
      'payment-service',
      'notification-service'
    ];
    
    for (const serviceName of serviceNames) {
      // Check if service account already exists
      const existingAccount = await ServiceAccount.findOne({ serviceName });
      
      if (!existingAccount) {
        console.log(`Creating service account for ${serviceName}...`);
        
        // Get default scopes for this service
        const scopes = getDefaultScopesForService(serviceName);
        
        // Generate client ID and secret
        const clientId = `svc_${require('crypto').randomBytes(16).toString('hex')}`;
        const clientSecret = require('crypto').randomBytes(32).toString('hex');

        // Hash the client secret
        const salt = await require('bcryptjs').genSalt(10);
        const hashedSecret = await require('bcryptjs').hash(clientSecret, salt);
        
        // Create service account manually without createdBy
        const serviceAccount = await ServiceAccount.create({
          name: `${serviceName} Service Account`,
          description: `Default service account for ${serviceName}`,
          serviceName,
          scopes,
          active: true,
          clientId,
          clientSecret: hashedSecret
        });
        
        console.log(`Created service account for ${serviceName} with clientId: ${clientId}`);
        console.log(`Initial client secret: ${clientSecret}`);
        console.log('IMPORTANT: Store this client secret securely, it won\'t be shown again');
      } else {
        console.log(`Service account for ${serviceName} already exists`);
      }
    }
    
    console.log('Service account seeding completed');
  } catch (error) {
    console.error('Error seeding service accounts:', error);
  }
};

module.exports = seedServiceAccounts; 