/**
 * PRODUCT SERVICE
 *
 * PURPOSE: Manages the product catalog and inventory for the e-commerce platform
 *
 * WHY THIS EXISTS:
 * - Separation of Concerns: Product data is isolated from users and orders
 * - Independent Scaling: Can scale based on product browsing traffic
 * - Dedicated Database: Has its own MongoDB instance for product data
 * - Microservice Pattern: Can be developed, deployed, and maintained independently
 *
 * RESPONSIBILITIES:
 * - CRUD operations for products (Create, Read, Update, Delete)
 * - Product catalog management
 * - Inventory tracking (stock levels)
 * - Product information storage (name, price, description, category, images)
 *
 * DATABASE: MongoDB (products database)
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * MONGODB CONNECTION STRING
 *
 * WHY: Defines where the product data is stored
 * - Uses 'mongodb' hostname (Kubernetes service name for internal DNS)
 * - Port 27017 is MongoDB's default port
 * - Database name 'products' isolates product data from other services
 *
 * PATTERN: Database-per-Service
 * - Each microservice has its own database
 * - Prevents tight coupling between services
 * - Allows independent schema evolution
 */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/products';

/**
 * MIDDLEWARE SETUP
 */

// CORS: Allow cross-origin requests (for frontend applications)
app.use(cors());

// JSON Parser: Parse incoming JSON request bodies
app.use(express.json());

/**
 * HEALTH CHECK ENDPOINT
 *
 * WHY: Kubernetes uses this to monitor container health
 * - Liveness probe checks if pod should be restarted
 * - Readiness probe checks if pod can receive traffic
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'product-service' });
});

/**
 * ROUTE CONFIGURATION
 *
 * WHY: Separates routing logic from main application file
 * - Keeps code organized and maintainable
 * - All product-related routes are defined in ./routes/products.js
 * - Prefixes all routes with /api/products
 */
app.use('/api/products', productRoutes);

/**
 * DATABASE CONNECTION AND SERVER STARTUP
 *
 * WHY THIS PATTERN:
 * - Waits for successful database connection before accepting requests
 * - Ensures the service doesn't accept traffic if it can't access data
 * - Fails fast if database is unreachable (exits with code 1)
 *
 * FLOW:
 * 1. Attempt MongoDB connection
 * 2. If successful: Start Express server
 * 3. If failed: Log error and exit (Kubernetes will restart the pod)
 */
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Only start server after successful database connection
    app.listen(PORT, () => {
      console.log(`Product service listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Exit with failure code so Kubernetes knows to restart
    process.exit(1);
  });
