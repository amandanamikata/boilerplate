/**
 * PRODUCT DATA MODEL
 *
 * PURPOSE: Defines the structure and validation rules for product data
 *
 * WHY THIS EXISTS:
 * - Schema Definition: Ensures all products have consistent structure
 * - Data Validation: Mongoose validates data before saving to database
 * - Type Safety: Enforces correct data types for each field
 * - Business Rules: Implements constraints like price >= 0, stock >= 0
 *
 * PATTERN: Active Record / ORM (Object-Relational Mapping)
 */

const mongoose = require('mongoose');

/**
 * PRODUCT SCHEMA
 *
 * Defines the structure of a product document in MongoDB
 */
const productSchema = new mongoose.Schema({
  /**
   * NAME
   * WHY required: Every product must have a name for identification
   * WHY trim: Removes whitespace from start/end (prevents ' Product ' vs 'Product')
   */
  name: {
    type: String,
    required: true,
    trim: true
  },

  /**
   * DESCRIPTION
   * WHY required: Products need descriptions for customers to make informed decisions
   */
  description: {
    type: String,
    required: true
  },

  /**
   * PRICE
   * WHY Number: Allows decimal values (e.g., 19.99)
   * WHY min: 0: Prevents negative prices (business rule)
   * WHY required: Every product must have a price
   */
  price: {
    type: Number,
    required: true,
    min: 0
  },

  /**
   * STOCK
   * WHY: Tracks inventory levels
   * WHY min: 0: Can't have negative stock
   * WHY default: 0: New products start with 0 stock until inventory is added
   */
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },

  /**
   * CATEGORY
   * WHY: Allows filtering and organizing products (e.g., 'Electronics', 'Clothing')
   */
  category: {
    type: String,
    required: true
  },

  /**
   * IMAGE URL
   * WHY: Products need visual representation
   * WHY optional: Product might not have an image yet
   * WHY URL: Image is stored externally (CDN, cloud storage), not in database
   */
  imageUrl: {
    type: String
  }
}, {
  /**
   * TIMESTAMPS OPTION
   *
   * WHY: Automatically adds 'createdAt' and 'updatedAt' fields
   * - createdAt: When the product was first added
   * - updatedAt: When the product was last modified
   * - Useful for auditing and sorting (e.g., "newest products")
   */
  timestamps: true
});

/**
 * EXPORT MODEL
 *
 * Creates a Mongoose model named 'Product' from the schema
 * This model provides methods like .find(), .save(), .findById(), etc.
 */
module.exports = mongoose.model('Product', productSchema);
