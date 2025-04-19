const { redisClient, isRedisAvailable } = require('../config/redis');
const { getTokenExpiration } = require('./jwtUtils');

// Prefix for blacklisted tokens in Redis
const BLACKLIST_PREFIX = process.env.TOKEN_BLACKLIST_PREFIX || 'bl_';

// Fallback in-memory blacklist when Redis is not available
const memoryBlacklist = new Map();

/**
 * Check if a token is blacklisted
 * @param {String} token - The token to check
 * @returns {Boolean} True if the token is blacklisted
 */
const isBlacklisted = async (token) => {
  try {
    // Use Redis if available
    if (isRedisAvailable()) {
      const exists = await redisClient.exists(`${BLACKLIST_PREFIX}${token}`);
      return exists === 1;
    }
    
    // Fallback to memory blacklist
    return memoryBlacklist.has(token);
  } catch (error) {
    console.error('Blacklist check error:', error);
    // If Redis fails, check memory blacklist
    return memoryBlacklist.has(token);
  }
};

/**
 * Add a token to the blacklist
 * @param {String} token - The token to blacklist
 * @param {Number} expireInSeconds - How long to keep the token in the blacklist
 * @returns {Boolean} True if the operation was successful
 */
const blacklistToken = async (token, expireInSeconds) => {
  try {
    // Use Redis if available
    if (isRedisAvailable()) {
      const ttl = expireInSeconds || process.env.TOKEN_BLACKLIST_EXPIRE || 86400; // Default: 24 hours

      // If token expiration can be determined, use that instead of default TTL
      const tokenExpiry = getTokenExpiration(token);
      if (tokenExpiry) {
        const secondsToExpiry = Math.max(1, Math.floor((tokenExpiry - new Date()) / 1000));
        // Use the token's actual expiry time (plus a small buffer) if available
        await redisClient.setEx(`${BLACKLIST_PREFIX}${token}`, secondsToExpiry + 60, '1');
      } else {
        // Otherwise use the specified TTL
        await redisClient.setEx(`${BLACKLIST_PREFIX}${token}`, ttl, '1');
      }
      
      return true;
    }
    
    // Fallback to memory blacklist
    const expiry = expireInSeconds || process.env.TOKEN_BLACKLIST_EXPIRE || 86400;
    
    // Store token in memory with expiration
    memoryBlacklist.set(token, Date.now() + (expiry * 1000));
    
    // Schedule cleanup after expiry
    setTimeout(() => {
      memoryBlacklist.delete(token);
    }, expiry * 1000);
    
    return true;
  } catch (error) {
    console.error('Blacklist token error:', error);
    
    // Fallback to memory blacklist on error
    const expiry = expireInSeconds || process.env.TOKEN_BLACKLIST_EXPIRE || 86400;
    memoryBlacklist.set(token, Date.now() + (expiry * 1000));
    
    return true;
  }
};

/**
 * Remove a token from the blacklist
 * @param {String} token - The token to remove
 * @returns {Boolean} True if the operation was successful
 */
const removeFromBlacklist = async (token) => {
  try {
    // Use Redis if available
    if (isRedisAvailable()) {
      await redisClient.del(`${BLACKLIST_PREFIX}${token}`);
    }
    
    // Always check memory blacklist too
    memoryBlacklist.delete(token);
    
    return true;
  } catch (error) {
    console.error('Remove from blacklist error:', error);
    
    // Fallback to memory blacklist on error
    memoryBlacklist.delete(token);
    
    return true;
  }
};

// Cleanup expired tokens from memory blacklist periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of memoryBlacklist.entries()) {
    if (expiry < now) {
      memoryBlacklist.delete(token);
    }
  }
}, 60000); // Clean up every minute

module.exports = {
  isBlacklisted,
  blacklistToken,
  removeFromBlacklist
}; 