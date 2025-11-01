/**
 * ORDER DATA MODEL
 *
 * PURPOSE: Defines the structure for orders and order items
 *
 * WHY THIS EXISTS:
 * - Data Structure: Ensures consistent order format
 * - Business Rules: Enforces order constraints (quantities, statuses)
 * - Data Integrity: Validates order data before saving
 * - Status Tracking: Manages order lifecycle
 *
 * DESIGN PATTERN: Document with Subdocuments
 * - Order contains embedded orderItems (subdocuments)
 * - WHY: Items always belong to one order, never shared
 * - Improves query performance (one database call gets entire order)
 */

const mongoose = require('mongoose');

/**
 * ORDER ITEM SCHEMA (SUBDOCUMENT)
 *
 * PURPOSE: Represents a single product in an order
 *
 * WHY SUBDOCUMENT:
 * - Order items don't exist independently of orders
 * - Always retrieved with the order
 * - Embedded for better performance
 *
 * WHY DENORMALIZATION:
 * - Stores productName and price at time of order
 * - WHY: Product might be deleted or price might change later
 * - Order should reflect what was ordered at that time
 * - This is a common pattern in microservices (eventual consistency)
 */
const orderItemSchema = new mongoose.Schema({
  /**
   * PRODUCT ID
   * WHY String: References Product Service (cross-service reference)
   * WHY not ObjectId: Product might be in different database/service
   * Used to look up product if needed, but not a strict foreign key
   */
  productId: {
    type: String,
    required: true
  },

  /**
   * PRODUCT NAME
   * WHY: Snapshot of product name at time of order
   * WHY needed: Product might be renamed or deleted later
   * Order should show what was actually ordered
   */
  productName: {
    type: String,
    required: true
  },

  /**
   * QUANTITY
   * WHY min: 1: Can't order 0 or negative items
   */
  quantity: {
    type: Number,
    required: true,
    min: 1
  },

  /**
   * PRICE
   * WHY: Price at time of purchase (not current price)
   * WHY needed: Prices change over time
   * Order history must reflect what customer actually paid
   * This prevents disputes and maintains accurate financial records
   */
  price: {
    type: Number,
    required: true,
    min: 0
  }
});

/**
 * ORDER SCHEMA
 *
 * PURPOSE: Represents a complete customer order
 */
const orderSchema = new mongoose.Schema({
  /**
   * USER ID
   * WHY String: References User Service (cross-service reference)
   * Links order to the user who placed it
   */
  userId: {
    type: String,
    required: true
  },

  /**
   * ITEMS
   * WHY Array: Orders can contain multiple products
   * WHY Subdocument: Items are embedded for performance
   * Each element is an orderItemSchema
   */
  items: [orderItemSchema],

  /**
   * TOTAL AMOUNT
   * WHY: Pre-calculated total for the entire order
   * WHY min: 0: Can't have negative order totals
   *
   * CALCULATION: Sum of (price * quantity) for all items
   * WHY store: Faster queries, historical accuracy
   * Calculated during order creation and stored
   */
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },

  /**
   * STATUS
   * WHY: Tracks order through its lifecycle
   *
   * STATUS FLOW:
   * pending -> processing -> shipped -> delivered
   *                       \-> cancelled (can happen at any stage before shipped)
   *
   * - pending: Order created, payment pending
   * - processing: Payment confirmed, being prepared
   * - shipped: Order dispatched to customer
   * - delivered: Order received by customer
   * - cancelled: Order cancelled by customer or admin
   *
   * WHY enum: Restricts to valid statuses only
   * WHY default: New orders start as pending
   */
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  /**
   * SHIPPING ADDRESS
   * WHY: Stores delivery address
   * WHY subdocument: Address components are always used together
   * WHY not required: Some fields optional for flexibility
   *
   * NOTE: In production, should validate required fields
   */
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  }
}, {
  /**
   * TIMESTAMPS
   * - createdAt: When order was placed
   * - updatedAt: Last status change or modification
   *
   * WHY important for orders:
   * - Track when order was placed
   * - Calculate delivery times
   * - Generate time-based reports
   */
  timestamps: true
});

/**
 * EXPORT MODEL
 */
module.exports = mongoose.model('Order', orderSchema);
