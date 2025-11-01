/**
 * USER AUTHENTICATION AND PROFILE ROUTES
 *
 * PURPOSE: Handles user registration, login, and profile management
 *
 * SECURITY FEATURES:
 * - JWT (JSON Web Token) based authentication
 * - Password hashing via User model
 * - Duplicate email detection
 * - Token expiration (24 hours)
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT SECRET KEY
 *
 * WHY: Used to sign and verify JWT tokens
 * SECURITY:
 * - MUST be changed in production
 * - Should be a long, random string
 * - Should be stored in environment variables, not code
 * - Same secret must be used by all services that verify tokens
 *
 * JWT TOKENS:
 * - Stateless authentication (no session storage needed)
 * - Self-contained (includes user info in encrypted form)
 * - Can be verified without database lookup
 * - Expires after set time period
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * USER REGISTRATION
 *
 * ENDPOINT: POST /api/users/register
 *
 * PURPOSE: Creates new user account
 *
 * FLOW:
 * 1. Check if email already exists (prevent duplicates)
 * 2. Create user with hashed password (automatic via User model)
 * 3. Generate JWT token for immediate login
 * 4. Return user object (without password) and token
 *
 * REQUEST BODY:
 * {
 *   email: string,
 *   password: string (min 6 chars),
 *   firstName: string,
 *   lastName: string
 * }
 *
 * RESPONSE:
 * - 201: { user: {...}, token: "jwt..." }
 * - 400: { message: "User already exists" } or validation error
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    /**
     * DUPLICATE CHECK
     * WHY: Prevents multiple accounts with same email
     * WHY HERE: Better to check before creating user than handling unique constraint error
     */
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    /**
     * CREATE USER
     * NOTE: Password will be automatically hashed by pre-save hook in User model
     */
    const user = new User({
      email,
      password,
      firstName,
      lastName
    });

    // Save to database (triggers password hashing)
    await user.save();

    /**
     * GENERATE JWT TOKEN
     *
     * PAYLOAD: Data embedded in token (not secret, but tamper-proof)
     * - userId: To identify user without database lookup
     * - email: For convenience
     * - role: For authorization (customer vs admin)
     *
     * OPTIONS:
     * - expiresIn: Token valid for 24 hours, then must re-login
     *
     * WHY JWT:
     * - Stateless: No session storage on server
     * - Scalable: Any service can verify token
     * - Self-contained: Includes user info
     */
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    /**
     * RETURN USER AND TOKEN
     * - 201 = Created (standard for successful registration)
     * - user object has password removed (via toJSON method)
     * - token used for subsequent authenticated requests
     */
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * USER LOGIN
 *
 * ENDPOINT: POST /api/users/login
 *
 * PURPOSE: Authenticates existing user
 *
 * SECURITY FLOW:
 * 1. Find user by email
 * 2. Compare provided password with hashed password (using bcrypt)
 * 3. Generate JWT token if valid
 * 4. Return user and token
 *
 * WHY GENERIC ERROR MESSAGE:
 * - "Invalid credentials" for both cases (user not found OR wrong password)
 * - Prevents attackers from discovering which emails are registered
 * - Security through obscurity principle
 *
 * REQUEST BODY:
 * {
 *   email: string,
 *   password: string
 * }
 *
 * RESPONSE:
 * - 200: { user: {...}, token: "jwt..." }
 * - 401: { message: "Invalid credentials" }
 * - 500: Server error
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // 401 = Unauthorized
      // WHY generic message: Don't reveal if email exists
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    /**
     * VERIFY PASSWORD
     * Uses comparePassword method from User model
     * This method:
     * 1. Takes the plain text password
     * 2. Hashes it with the same salt as stored password
     * 3. Compares hashes securely
     */
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Same error message as above for security
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    /**
     * GENERATE TOKEN
     * Same process as registration
     */
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user (password automatically removed) and token
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET USER PROFILE
 *
 * ENDPOINT: GET /api/users/profile/:id
 *
 * PURPOSE: Retrieve user profile information
 *
 * WHY: Allows viewing user details without exposing password
 * USE CASES:
 * - Display user profile page
 * - Show user info in order history
 * - Admin viewing user details
 *
 * NOTE: In production, this should be protected by authentication middleware
 * Only allow users to view their own profile, or admins to view any profile
 *
 * PARAMETERS:
 * - id: User's MongoDB ObjectId
 */
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Password automatically removed via toJSON method
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * UPDATE USER PROFILE
 *
 * ENDPOINT: PUT /api/users/:id
 *
 * PURPOSE: Update user profile information
 *
 * SECURITY:
 * - Password updates are BLOCKED through this route
 * - Prevents accidental password changes
 * - Forces password changes through separate, more secure endpoint (should be added)
 *
 * WHY SEPARATE PASSWORD UPDATE:
 * - Password changes should require current password verification
 * - Should have additional security measures (email confirmation, etc.)
 * - Shouldn't be mixed with regular profile updates
 *
 * USE CASES:
 * - Update name
 * - Change email (should verify new email in production)
 * - Update profile information
 *
 * NOTE: In production, should verify user owns this profile or is admin
 */
router.put('/:id', async (req, res) => {
  try {
    // Copy request body
    const updates = { ...req.body };

    /**
     * SECURITY: Prevent password updates
     * WHY: Password changes need special handling:
     * - Should verify current password
     * - Should go through proper hashing
     * - Should be separate endpoint with additional security
     */
    delete updates.password;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,         // Return updated document
        runValidators: true  // Validate updates against schema
      }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * EXPORT ROUTER
 */
module.exports = router;
