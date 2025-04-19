const jwt = require('jsonwebtoken');
const { getPermissionsForRole } = require('./permissions');

/**
 * Generate JWT token with user info and permissions
 * @param {Object} user - User object from database
 * @param {String} expiresIn - Override default expiration
 * @returns {String} JWT token
 */
const generateTokenWithPermissions = (user, expiresIn = process.env.JWT_EXPIRE) => {
  // Get default permissions for the user's role
  const rolePermissions = getPermissionsForRole(user.userType);
  
  // Combine role permissions with any custom permissions
  // Use Set to remove duplicates
  const allPermissions = [
    ...new Set([...rolePermissions, ...(user.customPermissions || [])])
  ];
  
  // Create token payload with user info and permissions
  const payload = {
    id: user._id,
    email: user.email,
    userType: user.userType,
    permissions: allPermissions,
    type: 'user' // Explicitly mark this as a user token
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Generate JWT token
 * @param {Object} payload - Data to be included in the token
 * @param {String} expiresIn - Override default expiration
 * @returns {String} JWT token
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRE) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Generate service-to-service JWT token
 * @param {Object} serviceAccount - Service account object from database
 * @param {String} expiresIn - Override default expiration
 * @returns {String} JWT token
 */
const generateServiceToken = (serviceAccount, expiresIn = process.env.SERVICE_TOKEN_EXPIRE || '1h') => {
  // Create token payload with service info and scopes
  const payload = {
    serviceId: serviceAccount._id,
    clientId: serviceAccount.clientId,
    serviceName: serviceAccount.serviceName,
    scopes: serviceAccount.scopes,
    type: 'service' // Explicitly mark this as a service token
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Get expiration time from token without verifying signature
 * @param {String} token - JWT token to decode
 * @returns {Date|null} Expiration date or null if invalid
 */
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded && decoded.exp ? new Date(decoded.exp * 1000) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if a token is a service token
 * @param {String} token - JWT token to check
 * @returns {Boolean} True if the token is a service token
 */
const isServiceToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded && decoded.type === 'service';
  } catch (error) {
    return false;
  }
};

/**
 * Check if a token is a user token
 * @param {String} token - JWT token to check
 * @returns {Boolean} True if the token is a user token
 */
const isUserToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded && decoded.type === 'user';
  } catch (error) {
    return false;
  }
};

module.exports = {
  generateToken,
  generateTokenWithPermissions,
  generateServiceToken,
  verifyToken,
  getTokenExpiration,
  isServiceToken,
  isUserToken
}; 