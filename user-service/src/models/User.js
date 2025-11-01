/**
 * USER DATA MODEL
 *
 * PURPOSE: Defines user schema with built-in security features
 *
 * WHY THIS EXISTS:
 * - Data Structure: Consistent user data format
 * - Security: Automatic password hashing before storage
 * - Authentication: Built-in password comparison method
 * - Privacy: Automatic password removal from API responses
 * - Authorization: Role-based access control (customer/admin)
 *
 * SECURITY APPROACH:
 * This model implements defense-in-depth for password security:
 * 1. Never store passwords in plain text
 * 2. Hash passwords with bcrypt (industry standard)
 * 3. Use salt to prevent rainbow table attacks
 * 4. Automatically exclude passwords from JSON responses
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  /**
   * EMAIL
   * WHY unique: Each user needs a unique identifier for login
   * WHY lowercase: Prevents duplicate accounts with different cases (User@email.com vs user@email.com)
   * WHY trim: Removes accidental whitespace
   */
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  /**
   * PASSWORD
   * WHY minlength: 6: Basic security requirement (should be higher in production)
   * NOTE: This stores the HASHED password, never plain text
   * The hashing happens in the pre-save hook below
   */
  password: {
    type: String,
    required: true,
    minlength: 6
  },

  /**
   * FIRST NAME
   */
  firstName: {
    type: String,
    required: true,
    trim: true
  },

  /**
   * LAST NAME
   */
  lastName: {
    type: String,
    required: true,
    trim: true
  },

  /**
   * ROLE
   * WHY: Implements role-based access control (RBAC)
   * - customer: Regular users who can browse and purchase
   * - admin: Privileged users who can manage products, view all orders
   *
   * WHY enum: Restricts to valid roles only
   * WHY default: New users are customers by default (least privilege principle)
   */
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  }
}, {
  /**
   * TIMESTAMPS
   * Adds createdAt and updatedAt
   * Useful for tracking account age, last profile update, etc.
   */
  timestamps: true
});

/**
 * PRE-SAVE HOOK: PASSWORD HASHING
 *
 * WHY: Automatically hashes passwords before saving to database
 *
 * HOW IT WORKS:
 * 1. Runs before every .save() operation
 * 2. Checks if password was modified (skip hashing if updating other fields)
 * 3. Generates a salt (random data added to password)
 * 4. Hashes password + salt using bcrypt
 * 5. Replaces plain password with hash
 *
 * WHY BCRYPT:
 * - Specifically designed for password hashing
 * - Computationally expensive (slows down brute force attacks)
 * - Automatically handles salting
 * - Has built-in protection against timing attacks
 *
 * WHY SALT:
 * - Prevents rainbow table attacks
 * - Same password gets different hash for different users
 * - Even if two users have same password, hashes will differ
 */
userSchema.pre('save', async function(next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) return next();

  try {
    // Generate salt with cost factor of 10
    // WHY 10: Balance between security and performance
    // Higher = more secure but slower
    const salt = await bcrypt.genSalt(10);

    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * INSTANCE METHOD: COMPARE PASSWORD
 *
 * WHY: Securely compares a plain password with the hashed password
 *
 * USAGE: During login
 * const isValid = await user.comparePassword(enteredPassword);
 *
 * HOW IT WORKS:
 * - Takes plain text password from login attempt
 * - bcrypt.compare extracts salt from stored hash
 * - Hashes the candidate password with same salt
 * - Compares resulting hash with stored hash
 * - Returns true if match, false otherwise
 *
 * WHY NOT SIMPLE COMPARISON:
 * - Can't compare plain password to hash directly
 * - Need bcrypt to handle the salt and hashing algorithm
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * INSTANCE METHOD: TO JSON
 *
 * WHY: Automatically removes password when user object is converted to JSON
 *
 * SECURITY CRITICAL:
 * - Prevents accidentally exposing password hashes in API responses
 * - Called automatically when res.json(user) is used
 * - Defense in depth: Even hashed passwords shouldn't be exposed
 *
 * WORKS:
 * - toObject() converts Mongoose document to plain object
 * - delete obj.password removes password field
 * - Returns sanitized object
 */
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

/**
 * EXPORT MODEL
 */
module.exports = mongoose.model('User', userSchema);
