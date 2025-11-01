/**
 * ORDER SERVICE
 *
 * PURPOSE: Manages order processing and order history
 *
 * WHY THIS EXISTS:
 * - Business Logic Separation: Order processing is complex and deserves its own service
 * - Independent Scaling: Can scale based on order volume (e.g., during sales events)
 * - Data Isolation: Order data is separate from products and users
 * - Service Integration: Demonstrates inter-service communication pattern
 *
 * RESPONSIBILITIES:
 * - Create and manage orders
 * - Validate products exist before creating orders
 * - Calculate order totals
 * - Track order status (pending, processing, shipped, delivered, cancelled)
 * - Query orders by user
 * - Maintain order history
 *
 * INTER-SERVICE COMMUNICATION:
 * - Communicates with Product Service to validate products and get current prices
 * - This demonstrates the microservices pattern of service-to-service communication
 * - Uses HTTP/REST for communication (could also use message queues in production)
 *
 * DATABASE: MongoDB (orders database)
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3003;

/**
 * MONGODB CONNECTION STRING
 *
 * WHY: Defines where order data is stored
 * - Uses 'orders' database to isolate order data
 * - Allows orders to persist even if product/user services are down
 * - Enables independent scaling and backup of order data
 */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/orders';

/**
 * MIDDLEWARE SETUP
 */

// CORS: Allow cross-origin requests
app.use(cors());

// JSON Parser: Parse incoming request bodies
app.use(express.json());

/**
 * HEALTH CHECK ENDPOINT
 *
 * WHY: Kubernetes liveness/readiness probes
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'order-service' });
});

/**
 * ROUTE CONFIGURATION
 *
 * All order-related endpoints are in ./routes/orders.js
 */
app.use('/api/orders', orderRoutes);

/**
 * DATABASE CONNECTION AND SERVER STARTUP
 *
 * Follows the same fail-fast pattern as other services
 */
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Order service listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
