const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const keyword = req.query.keyword || '';
    const role = req.query.role || '';
    
    console.log('Admin getting users with filters:', { keyword, role });
    
    // Build filter object
    const filter = {};
    
    // Add search filter if provided
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    // Add role filter if provided
    if (role === 'admin') {
      filter.isAdmin = true;
    } else if (role === 'customer') {
      filter.isAdmin = false;
    }
    
    console.log('User filter:', JSON.stringify(filter));
    
    // Count total users matching the filter
    const totalUsers = await User.countDocuments(filter);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / pageSize);
    
    // Get users with pagination
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    
    console.log(`Found ${users.length} users`);
    
    // Return users with pagination info
    res.json({
      users,
      page,
      pages: totalPages,
      totalUsers
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ 
        message: '🗑️ User successfully deleted!',
        status: 'success',
        details: `User ${user.name} (${user.email}) has been permanently removed from the system.`,
        userId: req.params.id
      });
    } else {
      res.status(404).json({ 
        message: '❌ User not found',
        status: 'error'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    
    const totalSales = await Order.aggregate([
      {
        $match: { isPaid: true }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalPrice' }
        }
      }
    ]);
    
    const totalRevenue = totalSales.length > 0 ? totalSales[0].totalSales : 0;
    
    const recentOrders = await Order.find({})
      .populate('user', 'id name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const productCategories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      userCount,
      productCount,
      orderCount,
      totalRevenue,
      recentOrders,
      productCategories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete product review
// @route   DELETE /api/admin/products/:id/reviews/:reviewId
// @access  Private/Admin
const deleteReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (product) {
      const reviewIndex = product.reviews.findIndex(
        (r) => r._id.toString() === req.params.reviewId
      );
      
      if (reviewIndex !== -1) {
        product.reviews.splice(reviewIndex, 1);
        
        // Recalculate ratings
        if (product.reviews.length > 0) {
          product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
        } else {
          product.rating = 0;
        }
        
        product.numReviews = product.reviews.length;
        
        await product.save();
        res.json({ message: 'Review removed' });
      } else {
        res.status(404).json({ message: 'Review not found' });
      }
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new user (admin)
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      isAdmin: isAdmin || false,
      isVerified: true // Admin-created users are automatically verified
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        message: '✅ User created successfully!',
        status: 'success',
        details: `${name} (${email}) has been added to the system${isAdmin ? ' as an administrator' : ' as a regular user'}.`
      });
    } else {
      res.status(400).json({ 
        message: 'Invalid user data', 
        status: 'error' 
      });
    }
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  getDashboardStats,
  deleteReview,
  createUser,
};
