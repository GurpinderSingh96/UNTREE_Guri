const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getFeaturedProducts,
  getProductCategories,
  getProductColors,
  getProductMaterials,
  getRandomProducts,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// Configure multer storage for image uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/images/products/');
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.route('/').get(getProducts).post(protect, admin, upload.array('images', 5), createProduct);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getProductCategories);
router.get('/colors', getProductColors);
router.get('/materials', getProductMaterials);
router.get('/random', getRandomProducts);
router
  .route('/:id')
  .get(getProductById)
  .put(protect, admin, upload.array('images', 5), updateProduct)
  .delete(protect, admin, deleteProduct);
router.route('/:id/reviews').post(protect, createProductReview);

module.exports = router;
