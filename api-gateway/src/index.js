require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Service URLs
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

// Service status
app.get('/status', async (req, res) => {
  const axios = require('axios');
  const services = {
    gateway: 'healthy',
    product: 'unknown',
    user: 'unknown',
    order: 'unknown'
  };

  try {
    await axios.get(`${PRODUCT_SERVICE_URL}/health`, { timeout: 2000 });
    services.product = 'healthy';
  } catch (error) {
    services.product = 'unhealthy';
  }

  try {
    await axios.get(`${USER_SERVICE_URL}/health`, { timeout: 2000 });
    services.user = 'healthy';
  } catch (error) {
    services.user = 'unhealthy';
  }

  try {
    await axios.get(`${ORDER_SERVICE_URL}/health`, { timeout: 2000 });
    services.order = 'healthy';
  } catch (error) {
    services.order = 'unhealthy';
  }

  res.json(services);
});

// Proxy routes
app.use('/api/products', createProxyMiddleware({
  target: PRODUCT_SERVICE_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Product service error:', err.message);
    res.status(503).json({ message: 'Product service unavailable' });
  }
}));

app.use('/api/users', createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('User service error:', err.message);
    res.status(503).json({ message: 'User service unavailable' });
  }
}));

app.use('/api/orders', createProxyMiddleware({
  target: ORDER_SERVICE_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Order service error:', err.message);
    res.status(503).json({ message: 'Order service unavailable' });
  }
}));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
  console.log(`Routing to:`);
  console.log(`  - Product Service: ${PRODUCT_SERVICE_URL}`);
  console.log(`  - User Service: ${USER_SERVICE_URL}`);
  console.log(`  - Order Service: ${ORDER_SERVICE_URL}`);
});
