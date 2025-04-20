const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy requests to the auth service
  app.use(
    '/api/auth',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    })
  );

  // Proxy requests to the order service
  app.use(
    ['/api/orders', '/api/cart', '/api/addresses'],
    createProxyMiddleware({
      target: 'http://localhost:3003',
      changeOrigin: true,
    })
  );

  // Proxy requests to the restaurant service
  app.use(
    ['/api/food-items', '/api/categories'],
    createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
    })
  );
}; 