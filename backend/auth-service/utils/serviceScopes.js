/**
 * Predefined scopes for service-to-service communication
 */

// Service-specific scopes
const SERVICE_SCOPES = {
  // Restaurant service scopes
  'restaurant-service': {
    READ: 'restaurant-service:read',
    WRITE: 'restaurant-service:write',
    ADMIN: 'restaurant-service:admin'
  },
  
  // Order service scopes
  'order-service': {
    READ: 'order-service:read',
    WRITE: 'order-service:write',
    ADMIN: 'order-service:admin'
  },
  
  // Delivery service scopes
  'delivery-service': {
    READ: 'delivery-service:read',
    WRITE: 'delivery-service:write',
    ADMIN: 'delivery-service:admin'
  },
  
  // Payment service scopes
  'payment-service': {
    READ: 'payment-service:read',
    WRITE: 'payment-service:write',
    ADMIN: 'payment-service:admin'
  },
  
  // Notification service scopes
  'notification-service': {
    READ: 'notification-service:read',
    WRITE: 'notification-service:write',
    ADMIN: 'notification-service:admin'
  }
};

// API Gateway needs all scopes for proper routing and authorization
const ALL_SERVICE_SCOPES = Object.values(SERVICE_SCOPES)
  .reduce((allScopes, serviceScopes) => {
    return [...allScopes, ...Object.values(serviceScopes)];
  }, []);

/**
 * Get default scopes for a service
 * @param {String} serviceName - The name of the service
 * @returns {Array} Array of default scopes for the service
 */
const getDefaultScopesForService = (serviceName) => {
  if (serviceName === 'api-gateway') {
    return ALL_SERVICE_SCOPES;
  }
  
  if (SERVICE_SCOPES[serviceName]) {
    return Object.values(SERVICE_SCOPES[serviceName]);
  }
  
  return [];
};

/**
 * Validate scopes for a service
 * @param {String} serviceName - The name of the service
 * @param {Array} scopes - The scopes to validate
 * @returns {Boolean} True if all scopes are valid for the service
 */
const validateServiceScopes = (serviceName, scopes) => {
  if (!scopes || !Array.isArray(scopes)) {
    return false;
  }
  
  // API Gateway can have any scope
  if (serviceName === 'api-gateway') {
    return true;
  }
  
  // For other services, ensure all scopes are valid
  const validScopes = Object.values(SERVICE_SCOPES)
    .reduce((allScopes, serviceScopes) => {
      return [...allScopes, ...Object.values(serviceScopes)];
    }, []);
  
  return scopes.every(scope => validScopes.includes(scope));
};

module.exports = {
  SERVICE_SCOPES,
  ALL_SERVICE_SCOPES,
  getDefaultScopesForService,
  validateServiceScopes
}; 