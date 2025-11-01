/**
 * USER SERVICE
 *
 * PURPOSE: Manages user authentication, registration, and profile data
 *
 * WHY THIS EXISTS:
 * - Security Isolation: User authentication and credentials are isolated from other services
 * - Separation of Concerns: User management is independent from products and orders
 * - Independent Scaling: Can scale based on user traffic (registrations, logins)
 * - Dedicated Database: Has its own MongoDB instance for user data security
 *
 * RESPONSIBILITIES:
 * - User registration with password hashing
 * - User authentication and JWT token generation
 * - User profile management
 * - Password security (bcrypt hashing)
 * - Role-based access (customer vs admin)
 *
 * SECURITY FEATURES:
 * - Passwords are never stored in plain text
 * - bcrypt hashing with salt for password protection
 * - JWT tokens for stateless authentication
 * - Password excluded from API responses
 *
 * DATABASE: MongoDB (users database)
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3002;

/**
 * MONGODB CONNECTION STRING
 *
 * WHY: Defines where user data is stored
 * - Uses 'users' database to separate user data from other services
 * - Improves security by isolating sensitive authentication data
 * - Allows independent backup and recovery of user data
 */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/users';

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
  res.json({ status: 'healthy', service: 'user-service' });
});

/**
 * ROUTE CONFIGURATION
 *
 * All user-related endpoints (register, login, profile) are in ./routes/users.js
 */
app.use('/api/users', userRoutes);

/**
 * DATABASE CONNECTION AND SERVER STARTUP
 *
 * Follows the same fail-fast pattern as other services
 */
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`User service listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
