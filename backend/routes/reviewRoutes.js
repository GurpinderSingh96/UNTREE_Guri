const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { createProductReview } = require('../controllers/productController');

// Since review functionality is already handled in productController,
// we'll just create routes that redirect to those functions

// @route   POST /api/reviews/:id
// @desc    Create a new review for a product
// @access  Private
router.post('/:id', protect, createProductReview);

// We can add more review-specific routes here as needed
// For example:
// - GET /api/reviews/:productId (get all reviews for a product)
// - DELETE /api/reviews/:id (delete a review)
// - PUT /api/reviews/:id (update a review)

module.exports = router;
