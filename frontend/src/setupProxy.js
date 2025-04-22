const { createProxyMiddleware } = require('http-proxy-middleware');

// Get service URLs from environment variables or use localhost defaults for local development
const AUTH_SERVICE_URL = process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.REACT_APP_ORDER_SERVICE_URL || 'http://localhost:3003';
const RESTAURANT_SERVICE_URL = process.env.REACT_APP_RESTAURANT_SERVICE_URL || 'http://localhost:3002';

// Log environment variables for debugging
console.log('🌐 Proxy Configuration:');
console.log(`- AUTH_SERVICE_URL: ${AUTH_SERVICE_URL}`);
console.log(`- ORDER_SERVICE_URL: ${ORDER_SERVICE_URL}`);
console.log(`- RESTAURANT_SERVICE_URL: ${RESTAURANT_SERVICE_URL}`);

// In Docker, React's development server needs to send requests to host.docker.internal
// This is because the proxy in development mode runs in the same container
const isInDocker = process.env.DOCKER_CONTAINER === 'true';
const dockerHost = 'host.docker.internal';

// Choose appropriate target based on environment
const getTarget = (serviceUrl) => {
  if (isInDocker) {
    // Extract port from service URL
    const urlParts = serviceUrl.split(':');
    const port = urlParts[urlParts.length - 1];
    
    // Use host.docker.internal to access host machine services
    return `http://${dockerHost}:${port}`;
  }
  return serviceUrl;
};

module.exports = function(app) {
  // Proxy requests to the auth service with improved error handling
  app.use(
    ['/api/auth', '/api/admin', '/api/users'],
    createProxyMiddleware({
      target: getTarget(AUTH_SERVICE_URL),
      changeOrigin: true,
      // Add error handling and logging
      onError: (err, req, res) => {
        console.error('Auth Service Proxy Error:', err);
        res.writeHead(502, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          success: false,
          message: 'Auth service unavailable',
          error: err.message 
        }));
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Auth Service Proxy Request: ${req.method} ${req.path} -> ${getTarget(AUTH_SERVICE_URL)}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`Auth Service Proxy Response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
      },
      pathRewrite: {
        '^/api/auth': '/api/auth',
        '^/api/admin': '/api/admin',
        '^/api/users': '/api/users'
      }
    })
  );

  // Proxy requests to the order service
  app.use(
    ['/api/orders', '/api/cart', '/api/addresses'],
    createProxyMiddleware({
      target: getTarget(ORDER_SERVICE_URL),
      changeOrigin: true,
      onError: (err, req, res) => {
        console.error('Order Service Proxy Error:', err);
        res.writeHead(502, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          success: false,
          message: 'Order service unavailable',
          error: err.message 
        }));
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Order Service Proxy Request: ${req.method} ${req.path} -> ${getTarget(ORDER_SERVICE_URL)}`);
      },
      pathRewrite: {
        '^/api/orders': '/api/orders',
        '^/api/cart': '/api/cart',
        '^/api/addresses': '/api/addresses'
      }
    })
  );

  // Proxy requests to the restaurant service
  app.use(
    ['/api/food-items', '/api/categories'],
    createProxyMiddleware({
      target: getTarget(RESTAURANT_SERVICE_URL),
      changeOrigin: true,
      onError: (err, req, res) => {
        console.error('Restaurant Service Proxy Error:', err);
        res.writeHead(502, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          success: false,
          message: 'Restaurant service unavailable',
          error: err.message 
        }));
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Restaurant Service Proxy Request: ${req.method} ${req.path} -> ${getTarget(RESTAURANT_SERVICE_URL)}`);
      },
      pathRewrite: {
        '^/api/food-items': '/api/food-items',
        '^/api/categories': '/api/categories'
      }
    })
  );
}; 