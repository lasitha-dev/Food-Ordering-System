/**
 * Permission definitions for different user types
 * Using a granular permission system allows for more flexible authorization
 */

// Define all possible permissions in the system
const PERMISSIONS = {
  // User management permissions
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Restaurant permissions
  RESTAURANT_READ: 'restaurant:read',
  RESTAURANT_CREATE: 'restaurant:create',
  RESTAURANT_UPDATE: 'restaurant:update',
  RESTAURANT_DELETE: 'restaurant:delete',
  
  // Menu permissions
  MENU_READ: 'menu:read',
  MENU_CREATE: 'menu:create',
  MENU_UPDATE: 'menu:update',
  MENU_DELETE: 'menu:delete',
  
  // Order permissions
  ORDER_READ: 'order:read',
  ORDER_CREATE: 'order:create',
  ORDER_UPDATE: 'order:update',
  ORDER_CANCEL: 'order:cancel',
  
  // Delivery permissions
  DELIVERY_READ: 'delivery:read',
  DELIVERY_UPDATE: 'delivery:update',
  DELIVERY_ASSIGN: 'delivery:assign',
  
  // Payment permissions
  PAYMENT_READ: 'payment:read',
  PAYMENT_CREATE: 'payment:create',
  PAYMENT_REFUND: 'payment:refund',
  
  // Own profile permissions
  PROFILE_READ: 'profile:read',
  PROFILE_UPDATE: 'profile:update'
};

// Define role-based permissions mapping
const ROLE_PERMISSIONS = {
  // Admin has all permissions
  'admin': Object.values(PERMISSIONS),
  
  // Customer permissions
  'customer': [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.RESTAURANT_READ,
    PERMISSIONS.MENU_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_CANCEL,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.DELIVERY_READ
  ],
  
  // Restaurant admin permissions
  'restaurant-admin': [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.RESTAURANT_READ,
    PERMISSIONS.RESTAURANT_UPDATE,
    PERMISSIONS.MENU_READ,
    PERMISSIONS.MENU_CREATE,
    PERMISSIONS.MENU_UPDATE,
    PERMISSIONS.MENU_DELETE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.DELIVERY_READ
  ],
  
  // Delivery personnel permissions
  'delivery-personnel': [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.DELIVERY_READ,
    PERMISSIONS.DELIVERY_UPDATE
  ]
};

/**
 * Get permissions for a specific user type
 * @param {String} userType - The type of user
 * @returns {Array} Array of permission strings
 */
const getPermissionsForRole = (userType) => {
  return ROLE_PERMISSIONS[userType] || [];
};

/**
 * Check if a role has a specific permission
 * @param {String} userType - The type of user
 * @param {String} permission - The permission to check
 * @returns {Boolean} True if the role has the permission
 */
const hasPermission = (userType, permission) => {
  const permissions = getPermissionsForRole(userType);
  return permissions.includes(permission);
};

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  hasPermission
}; 