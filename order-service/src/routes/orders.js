/**
 * ORDER ROUTES
 *
 * PURPOSE: Handles order creation, tracking, and management
 *
 * KEY FEATURE: Inter-Service Communication
 * - Communicates with Product Service to validate products and get prices
 * - Demonstrates microservices pattern of service coordination
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');

/**
 * PRODUCT SERVICE URL
 *
 * WHY: Order Service needs to communicate with Product Service
 * PURPOSE:
 * - Validate products exist before creating orders
 * - Get current product prices and names
 * - Ensure data consistency across services
 *
 * PATTERN: Service-to-Service HTTP Communication
 * - Uses Kubernetes DNS (product-service) for internal routing
 * - Alternative patterns: Message queues, gRPC, service mesh
 */
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001';

/**
 * GET ALL ORDERS
 *
 * ENDPOINT: GET /api/orders
 *
 * WHY: Retrieve all orders in the system
 * USE CASES:
 * - Admin dashboard showing all orders
 * - Order management interface
 * - Analytics and reporting
 *
 * NOTE: In production, this should be:
 * - Paginated (limit results per request)
 * - Protected (admin-only access)
 * - Filtered (by date range, status, etc.)
 */
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET ORDERS BY USER
 *
 * ENDPOINT: GET /api/orders/user/:userId
 *
 * WHY: Retrieve order history for a specific user
 * USE CASES:
 * - User viewing their own order history
 * - Customer support viewing user's orders
 * - Generating user-specific reports
 *
 * PARAMETERS:
 * - userId: ID of the user whose orders to retrieve
 *
 * NOTE: In production, should verify requesting user owns these orders
 * or is an admin
 */
router.get('/user/:userId', async (req, res) => {
  try {
    // Find all orders where userId matches
    const orders = await Order.find({ userId: req.params.userId });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET ORDER BY ID
 *
 * ENDPOINT: GET /api/orders/:id
 *
 * WHY: Retrieve complete details of a specific order
 * USE CASES:
 * - Order detail page
 * - Order tracking
 * - Customer support
 * - Invoice generation
 *
 * PARAMETERS:
 * - id: MongoDB ObjectId of the order
 */
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * CREATE ORDER
 *
 * ENDPOINT: POST /api/orders
 *
 * PURPOSE: Creates a new order with product validation and price calculation
 *
 * THIS IS THE MOST COMPLEX ROUTE - DEMONSTRATES MICROSERVICES PATTERN:
 *
 * INTER-SERVICE COMMUNICATION FLOW:
 * 1. Client sends order request to API Gateway
 * 2. API Gateway forwards to Order Service
 * 3. Order Service calls Product Service for each item to:
 *    - Verify product exists
 *    - Get current price
 *    - Get product name
 * 4. Order Service calculates total
 * 5. Order Service saves order to database
 * 6. Returns created order to client
 *
 * WHY THIS PATTERN:
 * - Ensures products exist before creating order
 * - Gets authoritative price from Product Service
 * - Captures product data at time of order (snapshot)
 * - Prevents orders for non-existent products
 * - Prevents price manipulation (client can't fake prices)
 *
 * REQUEST BODY:
 * {
 *   userId: string,
 *   items: [{ productId: string, quantity: number }],
 *   shippingAddress: { street, city, state, zipCode, country }
 * }
 *
 * NOTE: Client only sends productId and quantity
 * This service fetches name and price from Product Service
 */
router.post('/', async (req, res) => {
  try {
    const { userId, items, shippingAddress } = req.body;

    /**
     * PRODUCT VALIDATION AND ENRICHMENT
     *
     * WHY: Client sends minimal data (productId, quantity)
     * WHY ENRICH: Need to add name and price from Product Service
     * WHY VALIDATE: Ensure all products exist before creating order
     *
     * PATTERN: Synchronous Inter-Service Communication
     * - Makes HTTP requests to Product Service
     * - Waits for response before continuing
     * - Alternative: Event-driven with message queues (eventual consistency)
     */
    const enrichedItems = [];
    let totalAmount = 0;

    // Process each item in the order
    for (const item of items) {
      try {
        /**
         * CALL PRODUCT SERVICE
         *
         * WHY: Get authoritative product data
         * - Verifies product exists
         * - Gets current price (prevents client price manipulation)
         * - Gets product name for order records
         *
         * SYNCHRONOUS CALL:
         * - Waits for Product Service response
         * - Blocks until we know product is valid
         * - WHY: Can't create order for invalid products
         *
         * ERROR HANDLING:
         * - If product doesn't exist, Product Service returns 404
         * - axios throws error on 404
         * - We catch it and return error to client
         */
        const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${item.productId}`);
        const product = response.data;

        /**
         * ENRICH ORDER ITEM
         *
         * Takes client data (productId, quantity) and adds:
         * - productName: From Product Service
         * - price: Current price from Product Service
         *
         * WHY CAPTURE PRICE:
         * - Price might change in the future
         * - Order should reflect price at time of purchase
         * - This is the "source of truth" for this transaction
         *
         * DENORMALIZATION:
         * - We're duplicating data (productName, price) from Product Service
         * - WHY: Microservices principle - each service owns its data
         * - Order data remains consistent even if product is deleted
         */
        enrichedItems.push({
          productId: product._id,
          productName: product.name,
          quantity: item.quantity,
          price: product.price
        });

        /**
         * CALCULATE RUNNING TOTAL
         * Adds this item's cost to order total
         */
        totalAmount += product.price * item.quantity;

      } catch (error) {
        /**
         * PRODUCT NOT FOUND
         *
         * If Product Service returns error (product doesn't exist):
         * - Stop order creation immediately
         * - Return 400 Bad Request to client
         * - Provide specific error message
         *
         * WHY FAIL FAST:
         * - Don't create order with invalid products
         * - Better to fail early than create bad data
         */
        return res.status(400).json({ message: `Product ${item.productId} not found` });
      }
    }

    /**
     * CREATE ORDER
     *
     * All products validated successfully, now create order:
     * - userId: Who placed the order
     * - items: Enriched with names and prices
     * - totalAmount: Calculated total
     * - shippingAddress: Delivery location
     * - status: Automatically set to 'pending' (default in schema)
     * - timestamps: Automatically added (createdAt, updatedAt)
     */
    const order = new Order({
      userId,
      items: enrichedItems,
      totalAmount,
      shippingAddress
    });

    // Save to database
    const newOrder = await order.save();

    // Return created order with 201 Created status
    res.status(201).json(newOrder);

  } catch (error) {
    // Database error or validation error
    res.status(400).json({ message: error.message });
  }
});

/**
 * UPDATE ORDER STATUS
 *
 * ENDPOINT: PATCH /api/orders/:id/status
 *
 * PURPOSE: Updates the status of an existing order
 *
 * WHY PATCH (not PUT):
 * - PATCH = partial update (only status field)
 * - PUT = full replacement (would require all fields)
 * - PATCH is more appropriate for single field updates
 *
 * STATUS TRANSITIONS:
 * - pending -> processing (payment confirmed)
 * - processing -> shipped (order dispatched)
 * - shipped -> delivered (customer received)
 * - any -> cancelled (cancellation)
 *
 * USE CASES:
 * - Warehouse marks order as shipped
 * - Delivery confirms delivery
 * - Admin updates status
 * - Automated status updates from logistics system
 *
 * REQUEST BODY:
 * {
 *   status: "processing" | "shipped" | "delivered" | "cancelled"
 * }
 *
 * NOTE: In production, should:
 * - Validate status transitions (can't go from delivered to pending)
 * - Send notifications on status change (email, SMS)
 * - Log status change history
 * - Restrict who can update (admin only)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    /**
     * UPDATE ORDER STATUS
     *
     * OPTIONS:
     * - new: true: Return updated order (not original)
     * - runValidators: true: Validate new status against enum
     *   (ensures status is valid: pending, processing, shipped, delivered, cancelled)
     */
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    /**
     * TIMESTAMP UPDATE
     * updatedAt is automatically updated by Mongoose timestamps option
     * Useful for tracking when order status last changed
     */
    res.json(order);
  } catch (error) {
    // Validation error if status is invalid
    res.status(400).json({ message: error.message });
  }
});

/**
 * CANCEL ORDER
 *
 * ENDPOINT: DELETE /api/orders/:id
 *
 * PURPOSE: Cancels an existing order
 *
 * WHY DELETE METHOD:
 * - Semantically represents "removing" the order from active orders
 * - RESTful convention for cancellation
 *
 * WHY NOT ACTUALLY DELETE:
 * - Soft delete pattern - mark as cancelled instead of removing
 * - Preserves order history
 * - Allows analytics on cancelled orders
 * - May be needed for accounting/auditing
 * - Customer might want to view cancelled orders
 *
 * BEHAVIOR:
 * - Sets status to 'cancelled'
 * - Order remains in database
 * - Can still be queried and viewed
 *
 * USE CASES:
 * - Customer cancels order before shipment
 * - Admin cancels fraudulent order
 * - Automated cancellation (payment failed, out of stock)
 *
 * NOTE: In production, should:
 * - Check if order can be cancelled (not if already shipped)
 * - Process refund if payment was made
 * - Update inventory (restore stock)
 * - Send cancellation confirmation email
 * - Verify user owns order or is admin
 */
router.delete('/:id', async (req, res) => {
  try {
    /**
     * SOFT DELETE
     * Changes status to 'cancelled' instead of removing from database
     */
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }  // Return updated order
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Return success message and cancelled order
    res.json({ message: 'Order cancelled', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * EXPORT ROUTER
 *
 * Makes all these routes available to be mounted in the main app
 */
module.exports = router;
