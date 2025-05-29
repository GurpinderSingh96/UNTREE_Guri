require('dotenv').config();
console.time('Server startup');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');

// Import routes with error handling
let productRoutes, userRoutes, reviewRoutes, orderRoutes, adminRoutes, uploadRoutes;

try {
  productRoutes = require('./routes/productRoutes');
  userRoutes = require('./routes/userRoutes');
  reviewRoutes = require('./routes/reviewRoutes');
  orderRoutes = require('./routes/orderRoutes');
  adminRoutes = require('./routes/adminRoutes');
  uploadRoutes = require('./routes/uploadRoutes');
  console.log('All route modules loaded successfully');
} catch (error) {
  console.error('Error loading route modules:', error.message);
  console.error('Make sure all route files exist in the ./routes/ directory');
}

// Create Express app
const app = express();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Define admin routes before the static middleware
app.get('/admin', (req, res) => {
  const adminPath = path.join(__dirname, '../frontend/admin/login.html');
  
  // Check if admin file exists
  if (fs.existsSync(adminPath)) {
    return res.sendFile(adminPath);
  } else {
    console.error('Admin login file not found:', adminPath);
    return res.status(404).send('Admin login page not found');
  }
});

// Serve static files from the frontend
const frontendPath = path.join(__dirname, '../frontend');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.use('/frontend', express.static(frontendPath));
  console.log('Frontend static files configured:', frontendPath);
} else {
  console.warn('Frontend directory not found:', frontendPath);
}

// Serve uploaded product images
const imagesPath = path.join(__dirname, 'public/images/products');
if (fs.existsSync(imagesPath)) {
  app.use('/images/products', express.static(imagesPath));
  console.log('Product images path configured:', imagesPath);
} else {
  console.warn('Product images directory not found:', imagesPath);
}

// API routes with conditional loading
if (productRoutes) app.use('/api/products', productRoutes);
if (userRoutes) app.use('/api/users', userRoutes);
if (reviewRoutes) app.use('/api/reviews', reviewRoutes);
if (orderRoutes) app.use('/api/orders', orderRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);
if (uploadRoutes) app.use('/api/admin', uploadRoutes);

// Connect to MongoDB with better error handling
console.time('MongoDB connection');

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI not found in environment variables');
  console.error('Please check your .env file');
} else {
  console.log('Attempting to connect to MongoDB...');
  
  mongoose.connect(mongoUri, {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 10000,
    family: 4  // Use IPv4, skip trying IPv6
  })
    .then(() => {
      console.timeEnd('MongoDB connection');
      console.log('✅ Connected to MongoDB successfully');
    })
    .catch((error) => {
      console.error('❌ MongoDB connection error:', error.message);
      console.error('Server will continue without database connection');
    });
}

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

// Handle 404 - API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  try {
    // Try to serve the requested file directly
    const requestedPath = path.join(__dirname, '..', req.path);
    
    // Check if the file exists and is actually a file (not directory)
    if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
      return res.sendFile(requestedPath);
    }
    
    // If not found, serve the frontend index.html
    const indexPath = path.join(__dirname, '../frontend/index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend not found');
    }
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).send('Internal server error');
  }
});

const PORT = process.env.PORT || 5006;

// Start server with proper error handling
const server = app.listen(PORT, () => {
  console.timeEnd('Server startup');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔧 Admin panel: http://localhost:${PORT}/admin`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.error('Try using a different port or kill the process using this port');
  } else {
    console.error('❌ Server error:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});