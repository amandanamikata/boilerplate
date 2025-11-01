/**
 * API GATEWAY SERVICE
 *
 * PURPOSE: Serves as the single entry point for all client requests in the microservices architecture
 *
 * WHY THIS EXISTS:
 * - Provides a unified interface for clients instead of exposing multiple service endpoints
 * - Handles cross-cutting concerns like rate limiting, CORS, and authentication
 * - Routes requests to appropriate backend microservices
 * - Simplifies client-side logic by providing a single point of contact
 * - Enables centralized monitoring, logging, and security policies
 *
 * ARCHITECTURE PATTERN: API Gateway Pattern
 */

// Load environment variables from .env file
// WHY: Allows configuration without changing code (12-factor app methodology)
require('dotenv').config();

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * SERVICE URLS CONFIGURATION
 *
 * WHY: These define the internal endpoints of our microservices
 * - Uses Kubernetes DNS service names (e.g., 'product-service') for internal routing
 * - In Kubernetes, services can reach each other using service names
 * - Falls back to defaults for local development
 */
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';

/**
 * MIDDLEWARE SETUP
 *
 * CORS (Cross-Origin Resource Sharing):
 * WHY: Allows frontend applications from different domains to access this API
 * - Essential for web applications running on different domains/ports
 * - Enables browser-based clients to make requests
 */
app.use(cors());

/**
 * JSON Body Parser:
 * WHY: Automatically parses incoming JSON request bodies
 * - Converts JSON strings to JavaScript objects
 * - Makes req.body available in route handlers
 */
app.use(express.json());

/**
 * RATE LIMITING
 *
 * WHY: Protects the API from abuse and DDoS attacks
 * - Prevents any single IP from overwhelming the service
 * - Ensures fair resource usage among all clients
 * - Improves overall system stability and availability
 *
 * CONFIGURATION:
 * - windowMs: 15 minutes time window
 * - max: 100 requests allowed per IP within the time window
 * - After limit is reached, client receives 429 (Too Many Requests) status
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Apply rate limiting to all routes
app.use(limiter);

/**
 * HEALTH CHECK ENDPOINT
 *
 * WHY: Kubernetes uses this endpoint to determine if the container is alive
 * - Part of Kubernetes liveness probe configuration
 * - If this fails, Kubernetes will restart the pod
 * - Simple check that the service is running and can respond to requests
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

/**
 * SERVICE STATUS ENDPOINT
 *
 * WHY: Provides visibility into the health of all downstream microservices
 * - Useful for monitoring dashboards and debugging
 * - Helps identify which specific service is down in the system
 * - Enables proactive monitoring and alerting
 *
 * BEHAVIOR:
 * - Makes health check requests to all backend services
 * - Uses 2-second timeout to avoid hanging
 * - Returns aggregated status of all services
 */
app.get('/status', async (req, res) => {
  const axios = require('axios');

  // Initialize status object with all services
  const services = {
    gateway: 'healthy',  // Gateway itself is healthy if we're responding
    product: 'unknown',
    user: 'unknown',
    order: 'unknown'
  };

  // Check Product Service health
  try {
    await axios.get(`${PRODUCT_SERVICE_URL}/health`, { timeout: 2000 });
    services.product = 'healthy';
  } catch (error) {
    services.product = 'unhealthy';
  }

  // Check User Service health
  try {
    await axios.get(`${USER_SERVICE_URL}/health`, { timeout: 2000 });
    services.user = 'healthy';
  } catch (error) {
    services.user = 'unhealthy';
  }

  // Check Order Service health
  try {
    await axios.get(`${ORDER_SERVICE_URL}/health`, { timeout: 2000 });
    services.order = 'healthy';
  } catch (error) {
    services.order = 'unhealthy';
  }

  res.json(services);
});

/**
 * PROXY ROUTES
 *
 * WHY: These are the core routing rules that forward requests to backend services
 * - Uses http-proxy-middleware to transparently forward requests
 * - Client only needs to know about the gateway, not individual services
 * - Enables independent scaling and deployment of services
 *
 * HOW IT WORKS:
 * - Client sends request to gateway (e.g., /api/products/123)
 * - Gateway forwards entire request to backend service
 * - Backend processes and returns response
 * - Gateway returns response to client
 */

/**
 * PRODUCT SERVICE PROXY
 *
 * Routes all /api/products/* requests to the Product Service
 *
 * OPTIONS:
 * - target: URL of the product service
 * - changeOrigin: Changes the origin header to match the target (important for virtual hosting)
 * - onError: Custom error handler for when the service is unavailable
 *
 * WHY onError: Provides graceful degradation when service is down
 * - Returns 503 (Service Unavailable) instead of crashing
 * - Gives meaningful error message to client
 */
app.use('/api/products', createProxyMiddleware({
  target: PRODUCT_SERVICE_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Product service error:', err.message);
    res.status(503).json({ message: 'Product service unavailable' });
  }
}));

/**
 * USER SERVICE PROXY
 *
 * Routes all /api/users/* requests to the User Service
 * Handles authentication, registration, and user profile operations
 */
app.use('/api/users', createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('User service error:', err.message);
    res.status(503).json({ message: 'User service unavailable' });
  }
}));

/**
 * ORDER SERVICE PROXY
 *
 * Routes all /api/orders/* requests to the Order Service
 * Handles order creation, tracking, and management
 */
app.use('/api/orders', createProxyMiddleware({
  target: ORDER_SERVICE_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Order service error:', err.message);
    res.status(503).json({ message: 'Order service unavailable' });
  }
}));

/**
 * 404 NOT FOUND HANDLER
 *
 * WHY: Catches all unmatched routes and returns a proper error response
 * - Placed at the end so it only matches if no other routes matched
 * - Prevents Express from sending default HTML error pages
 * - Returns JSON for consistency with API responses
 */
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

/**
 * START SERVER
 *
 * WHY: Binds the Express app to a port and starts listening for requests
 * - Logs configuration for debugging and operational visibility
 * - Shows which backend services are being used
 * - Confirms the service started successfully
 */
app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
  console.log(`Routing to:`);
  console.log(`  - Product Service: ${PRODUCT_SERVICE_URL}`);
  console.log(`  - User Service: ${USER_SERVICE_URL}`);
  console.log(`  - Order Service: ${ORDER_SERVICE_URL}`);
});
