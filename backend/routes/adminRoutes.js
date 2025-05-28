const express = require('express');
const router = express.Router();
const {
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  getDashboardStats,
  createUser,
} = require('../controllers/adminController');
const {
  getAllReviews,
  deleteReview
} = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes in this file are protected by admin middleware
router.use(protect, admin);

router.get('/dashboard', getDashboardStats);
router.route('/users')
  .get(getUsers)
  .post(createUser);
router.route('/users/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

// Reviews routes
router.get('/reviews', getAllReviews);
router.delete('/reviews/:productId/:reviewId', deleteReview);

module.exports = router;
