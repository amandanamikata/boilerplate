/**
 * PRODUCT ROUTES
 *
 * PURPOSE: Defines all HTTP endpoints for product operations
 *
 * WHY THIS EXISTS:
 * - RESTful API: Provides standard HTTP methods for product management
 * - Route Organization: Keeps routing logic separate from business logic
 * - Reusability: Router can be mounted at any path in the main app
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

/**
 * GET ALL PRODUCTS
 *
 * ENDPOINT: GET /api/products
 *
 * WHY: Allows clients to retrieve the entire product catalog
 * USE CASES:
 * - Display product listing page
 * - Populate product dropdowns
 * - Get all products for filtering/searching
 *
 * RETURNS: Array of all product objects
 */
router.get('/', async (req, res) => {
  try {
    // Find all products in database (no filter = get all)
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    // 500 = Internal Server Error (database or server issue)
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET PRODUCT BY ID
 *
 * ENDPOINT: GET /api/products/:id
 *
 * WHY: Retrieve a single product's complete details
 * USE CASES:
 * - Product detail page
 * - Order verification (checking product still exists)
 * - Updating product information
 *
 * PARAMETERS:
 * - id: MongoDB ObjectId of the product
 *
 * RETURNS:
 * - 200: Product object if found
 * - 404: Error if product doesn't exist
 * - 500: Error if database/server issue
 */
router.get('/:id', async (req, res) => {
  try {
    // Find product by MongoDB _id field
    const product = await Product.findById(req.params.id);

    // Check if product exists
    if (!product) {
      // 404 = Not Found
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    // 500 = Internal Server Error
    res.status(500).json({ message: error.message });
  }
});

/**
 * CREATE PRODUCT
 *
 * ENDPOINT: POST /api/products
 *
 * WHY: Allows adding new products to the catalog
 * USE CASES:
 * - Admin adds new product to store
 * - Bulk import of products
 * - Third-party integrations adding products
 *
 * REQUEST BODY: Product object with required fields
 * RETURNS:
 * - 201: Created product with generated _id
 * - 400: Validation error (missing fields, invalid data)
 */
router.post('/', async (req, res) => {
  // Create new Product instance from request body
  // WHY: Mongoose validates against schema and assigns default values
  const product = new Product({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    stock: req.body.stock,
    category: req.body.category,
    imageUrl: req.body.imageUrl
  });

  try {
    // Save to database (triggers validation)
    const newProduct = await product.save();
    // 201 = Created (standard for successful POST)
    res.status(201).json(newProduct);
  } catch (error) {
    // 400 = Bad Request (validation failed)
    res.status(400).json({ message: error.message });
  }
});

/**
 * UPDATE PRODUCT
 *
 * ENDPOINT: PUT /api/products/:id
 *
 * WHY: Allows modifying existing product information
 * USE CASES:
 * - Update price
 * - Adjust stock levels
 * - Change product description
 * - Update product images
 *
 * PARAMETERS:
 * - id: Product to update
 *
 * REQUEST BODY: Fields to update (partial or complete product object)
 *
 * OPTIONS:
 * - new: true - Returns updated document instead of original
 * - runValidators: true - Validates update against schema rules
 */
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    // 400 = Bad Request (validation failed)
    res.status(400).json({ message: error.message });
  }
});

/**
 * DELETE PRODUCT
 *
 * ENDPOINT: DELETE /api/products/:id
 *
 * WHY: Allows removing products from catalog
 * USE CASES:
 * - Product discontinued
 * - Remove duplicate entries
 * - Clean up test data
 *
 * PARAMETERS:
 * - id: Product to delete
 *
 * RETURNS:
 * - 200: Success message
 * - 404: Product not found
 * - 500: Server error
 *
 * NOTE: This is a hard delete. In production, consider soft delete
 * (marking as deleted rather than removing from database)
 */
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * EXPORT ROUTER
 *
 * WHY: Makes these routes available to be mounted in the main app
 * The main app mounts this at /api/products, so:
 * - POST /api/products -> creates product
 * - GET /api/products/:id -> gets specific product
 * - etc.
 */
module.exports = router;
