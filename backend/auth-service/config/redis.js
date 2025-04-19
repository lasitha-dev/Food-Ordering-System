const { createClient } = require('redis');

// Create Redis client with retry disabled
const redisClient = createClient({
  url: process.env.REDIS_URI || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: false // Disable automatic reconnection
  }
});

let redisAvailable = false;

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
  redisAvailable = false;
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
  redisAvailable = true;
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    redisAvailable = true;
    return true;
  } catch (error) {
    console.error('Redis connection error:', error);
    console.log('Continuing without Redis connection. Token blacklisting will be disabled.');
    redisAvailable = false;
    return false;
  }
};

// Check if Redis is available
const isRedisAvailable = () => {
  return redisAvailable && redisClient.isReady;
};

module.exports = {
  redisClient,
  connectRedis,
  isRedisAvailable
}; 