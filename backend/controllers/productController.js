const Product = require('../models/productModel');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.limit) || 12;
    const page = Number(req.query.page) || 1;
    
    // Build filter object
    let filter = {};
    
    // Handle keyword search
    if (req.query.keyword) {
      filter.$or = [
        { name: { $regex: req.query.keyword, $options: 'i' } },
        { description: { $regex: req.query.keyword, $options: 'i' } },
        { category: { $regex: req.query.keyword, $options: 'i' } }
      ];
    }
    
    // Handle category filter
    if (req.query.category) {
      const categories = req.query.category.split(',');
      filter.category = { $in: categories };
    }
    
    // Handle color filter
    if (req.query.color) {
      const colors = req.query.color.split(',');
      filter.color = { $in: colors };
    }
    
    // Handle material filter
    if (req.query.material) {
      const materials = req.query.material.split(',');
      
      // Create an array of conditions for material matching
      const materialConditions = [];
      
      // Add exact match condition
      materialConditions.push({ material: { $in: materials } });
      
      // Add regex match for comma-separated values
      materials.forEach(material => {
        materialConditions.push({ material: new RegExp(material, 'i') });
      });
      
      // If there's already an $or condition, we need to handle it differently
      if (filter.$or) {
        // Save the existing $or conditions
        const existingOr = filter.$or;
        // Remove $or from the filter
        delete filter.$or;
        // Create a new $and condition that combines the existing $or with our material conditions
        filter.$and = [
          { $or: existingOr },
          { $or: materialConditions }
        ];
      } else {
        // If no existing $or, just add our material conditions
        filter.$or = materialConditions;
      }
    }
    
    // Handle price range with discount consideration
    if (req.query.minPrice || req.query.maxPrice) {
      const minPrice = req.query.minPrice ? Number(req.query.minPrice) : 0;
      const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : Number.MAX_SAFE_INTEGER;
      
      // Use aggregation to filter by effective price (price after discount)
      return Product.aggregate([
        {
          $addFields: {
            // Calculate the effective price after discount
            effectivePrice: {
              $subtract: [
                "$price",
                { $multiply: ["$price", { $divide: ["$discount", 100] }] }
              ]
            }
          }
        },
        {
          $match: {
            ...filter,
            effectivePrice: { $gte: minPrice, $lte: maxPrice }
          }
        },
        {
          $sort: getSortOption(req.query.sort)
        },
        {
          $facet: {
            metadata: [{ $count: "total" }],
            products: [
              { $skip: pageSize * (page - 1) },
              { $limit: pageSize }
            ]
          }
        }
      ]).then(result => {
        const totalProducts = result[0].metadata[0]?.total || 0;
        const products = result[0].products;
        
        res.json({
          products,
          page,
          pages: Math.ceil(totalProducts / pageSize),
          totalProducts
        });
      });
    }
    
    // Handle sorting
    const sortOption = getSortOption(req.query.sort);
    
    console.log('Filter:', filter);
    console.log('Sort:', sortOption);
    
    const count = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortOption)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ 
      products, 
      page, 
      pages: Math.ceil(count / pageSize),
      totalProducts: count 
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to get sort option
function getSortOption(sortParam) {
  let sortOption = {};
  if (sortParam) {
    if (sortParam === 'price') sortOption = { price: 1 };
    else if (sortParam === '-price') sortOption = { price: -1 };
    else if (sortParam === '-createdAt') sortOption = { createdAt: -1 };
    else if (sortParam === 'featured') sortOption = { featured: -1 };
  }
  return sortOption;
}

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // If product doesn't have specifications or specifications is empty
      if (!product.specifications || 
          (typeof product.specifications === 'object' && Object.keys(product.specifications).length === 0)) {
        
        console.log('Creating specifications for product:', product.name);
        
        // Create specifications object
        const specifications = {};
        
        // Add basic specifications
        specifications['SKU'] = product._id.toString().substring(0, 8).toUpperCase();
        specifications['Category'] = product.category || 'N/A';
        
        if (product.material) {
          specifications['Material'] = Array.isArray(product.material) ? 
            product.material.join(', ') : product.material;
        }
        
        if (product.color) {
          specifications['Available Colors'] = Array.isArray(product.color) ? 
            product.color.join(', ') : product.color;
        }
        
        // Add some furniture-specific specifications
        if (product.category && product.category.toLowerCase().includes('chair')) {
          specifications['Weight Capacity'] = '250 lbs';
          specifications['Dimensions'] = '24" W x 26" D x 36" H';
          specifications['Assembly Required'] = 'Yes';
        } else if (product.category && product.category.toLowerCase().includes('table')) {
          specifications['Dimensions'] = '48" W x 30" D x 30" H';
          specifications['Assembly Required'] = 'Yes';
          specifications['Shape'] = 'Rectangular';
        } else if (product.category && product.category.toLowerCase().includes('sofa')) {
          specifications['Dimensions'] = '78" W x 35" D x 33" H';
          specifications['Weight Capacity'] = '600 lbs';
          specifications['Assembly Required'] = 'Minimal';
        }
        
        // Add warranty and care instructions for all products
        specifications['Warranty'] = '1 Year Limited';
        specifications['Care Instructions'] = 'Clean with soft, dry cloth';
        
        console.log('Created specifications:', specifications);
        
        // Add specifications to product
        product.specifications = specifications;
        
        // Save the updated product with specifications
        await product.save();
        console.log('Saved product with specifications');
      }
      
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    console.log("DEBUG - Create product request body:", req.body);
    console.log("DEBUG - Uploaded files:", req.files);
    
    const {
      name,
      price,
      description,
      category,
      countInStock,
      featured,
      discount,
      color,
      material,
      images, // Get images from request body
    } = req.body;

    // Process color field - handle JSON string
    let processedColor = color;
    if (color && typeof color === 'string' && color.startsWith('[')) {
      try {
        processedColor = JSON.parse(color);
      } catch (e) {
        console.error("Error parsing color JSON:", e);
      }
    }

    // Check if images array is provided in the request
    let imagePaths = ['/images/product-default.png']; // Default image path
    
    if (images && Array.isArray(images) && images.length > 0) {
      console.log("DEBUG - Using images from request body:", images);
      imagePaths = images;
    } else if (req.files && req.files.length > 0) {
      console.log("DEBUG - Using images from uploaded files:", req.files);
      // Make sure we're using the correct path format
      imagePaths = req.files.map(file => `/images/products/${file.filename}`);
    }
    
    console.log("DEBUG - Final image paths:", imagePaths);

    const product = new Product({
      name,
      price,
      description,
      images: imagePaths,
      category,
      countInStock,
      featured: featured === 'true' ? true : false,
      discount: discount || 0,
      color: processedColor,
      material,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    console.log("DEBUG - Update product request body:", req.body);
    
    const {
      name,
      price,
      description,
      category,
      countInStock,
      featured,
      discount,
      color,
      material,
      images, // Get images from request body
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.price = price || product.price;
      product.description = description || product.description;
      
      // Process color field - handle JSON string
      if (color) {
        let processedColor = color;
        if (typeof color === 'string' && color.startsWith('[')) {
          try {
            processedColor = JSON.parse(color);
          } catch (e) {
            console.error("Error parsing color JSON:", e);
          }
        }
        product.color = processedColor;
      }
      
      // Update material if provided
      if (material) {
        product.material = material;
      }
      
      // Update images if provided in request body
      if (images && Array.isArray(images)) {
        console.log("DEBUG - Updating images from request body:", images);
        product.images = images;
      }
      // Update images if new ones are uploaded
      else if (req.files && req.files.length > 0) {
        console.log("DEBUG - Updating images from uploaded files:", req.files);
        product.images = req.files.map(file => `/images/products/${file.filename}`);
      }
      
      console.log("DEBUG - Final product images:", product.images);
      
      product.category = category || product.category;
      product.countInStock = countInStock || product.countInStock;
      product.featured = featured !== undefined ? (featured === 'true' ? true : false) : product.featured;
      product.discount = discount !== undefined ? discount : product.discount;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
  try {
    const { rating, comment, title } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      // Create review object with title
      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        title: title || 'Review', // Use provided title or default
        user: req.user._id,
      };

      product.reviews.push(review);

      product.numReviews = product.reviews.length;

      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      
      // Return the newly created review along with success message
      res.status(201).json({ 
        message: 'Review added',
        review: {
          ...review,
          _id: product.reviews[product.reviews.length - 1]._id,
          createdAt: new Date()
        }
      });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ featured: true }).limit(4);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product colors
// @route   GET /api/products/colors
// @access  Public
const getProductColors = async (req, res) => {
  try {
    const colors = await Product.distinct('color');
    // Filter out null or empty values
    const validColors = colors.filter(color => color && color.trim() !== '');
    res.json(validColors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product materials
// @route   GET /api/products/materials
// @access  Public
const getProductMaterials = async (req, res) => {
  try {
    const materials = await Product.distinct('material');
    // Filter out null or empty values
    const validMaterials = materials.filter(material => material && material.trim() !== '');
    res.json(validMaterials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get random products
// @route   GET /api/products/random
// @access  Public
const getRandomProducts = async (req, res) => {
  try {
    const count = await Product.countDocuments();
    const limit = parseInt(req.query.limit) || 3; // Default to 3 products
    
    // Get random products using MongoDB aggregation
    const randomProducts = await Product.aggregate([
      { $sample: { size: limit } }
    ]);
    
    res.json(randomProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
