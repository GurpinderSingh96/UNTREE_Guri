const Product = require('../models/productModel');

// @desc    Get all reviews (for admin)
// @route   GET /api/admin/reviews
// @access  Private/Admin
const getAllReviews = async (req, res) => {
  try {
    // Get query parameters
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const keyword = req.query.keyword || '';
    const rating = req.query.rating ? parseInt(req.query.rating) : null;
    
    console.log('Admin getting reviews with filters:', { keyword, rating });
    
    // We'll need to aggregate reviews from all products
    const products = await Product.find({}).select('name images reviews');
    
    // Extract all reviews and add product info
    let allReviews = [];
    products.forEach(product => {
      if (product.reviews && product.reviews.length > 0) {
        product.reviews.forEach(review => {
          allReviews.push({
            ...review.toObject(),
            productId: product._id,
            productName: product.name,
            productImage: product.images && product.images.length > 0 ? product.images[0] : null
          });
        });
      }
    });
    
    // Apply filters
    if (keyword) {
      allReviews = allReviews.filter(review => 
        review.name.toLowerCase().includes(keyword.toLowerCase()) || 
        review.comment.toLowerCase().includes(keyword.toLowerCase()) ||
        review.productName.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    
    if (rating) {
      allReviews = allReviews.filter(review => review.rating === rating);
    }
    
    // Sort by date (newest first)
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Paginate results
    const totalReviews = allReviews.length;
    const totalPages = Math.ceil(totalReviews / pageSize);
    const paginatedReviews = allReviews.slice((page - 1) * pageSize, page * pageSize);
    
    res.json({
      reviews: paginatedReviews,
      page,
      pages: totalPages,
      totalReviews
    });
  } catch (error) {
    console.error('Error getting all reviews:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a review
// @route   DELETE /api/admin/reviews/:productId/:reviewId
// @access  Private/Admin
const deleteReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Find the review index
    const reviewIndex = product.reviews.findIndex(
      review => review._id.toString() === reviewId
    );
    
    if (reviewIndex === -1) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Remove the review from the array
    product.reviews.splice(reviewIndex, 1);
    
    // Recalculate product rating
    if (product.reviews.length > 0) {
      product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
      product.numReviews = product.reviews.length;
    } else {
      product.rating = 0;
      product.numReviews = 0;
    }
    
    await product.save();
    
    res.json({ message: 'Review removed' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllReviews,
  deleteReview
};
