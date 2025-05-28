require('dotenv').config();
console.time('Server startup');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');  // Add fs module for file checking

// Import routes
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Define admin routes before the static middleware
app.get('/admin', (req, res) => {
  return res.sendFile(path.join(__dirname, '../frontend/admin/login.html'));
});

// Serve static files from the frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve frontend files explicitly
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// Serve uploaded product images
app.use('/images/products', express.static(path.join(__dirname, 'public/images/products')));

// API routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', uploadRoutes);

// Serve admin panel from frontend directory
// app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));

// Redirect /admin root to admin login page
// app.get('/admin', (req, res) => {
//   return res.sendFile(path.join(__dirname, '../frontend/admin/login.html'));
// });

// Connect to MongoDB with optimized options
console.time('MongoDB connection');
mongoose.connect(process.env.MONGODB_URI, {
  connectTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  family: 4  // Use IPv4, skip trying IPv6
})
  .then(() => {
    console.timeEnd('MongoDB connection');
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Handle 404 - API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  // Try to serve the requested file directly
  const requestedPath = path.join(__dirname, '..', req.path);
  
  // Check if the file exists
  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
    return res.sendFile(requestedPath);
  }
  
  // If not found, serve the frontend index.html
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.st