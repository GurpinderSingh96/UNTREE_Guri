const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail, sendWelcomeEmail, generateVerificationToken } = require('../utils/emailService');

// Password validation function
const validatePassword = (password) => {
  // Check minimum length
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for number
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  
  return { isValid: true };
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password,isAdmin } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      isAdmin,
      isVerified: process.env.NODE_ENV !== 'production' // Auto-verify in development
    });

    if (user) {
      // In development mode, skip email verification
      if (process.env.NODE_ENV !== 'production') {
        console.log('Development mode: User automatically verified');
        
        res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          isVerified: user.isVerified,
          message: 'Registration successful! Your account has been automatically verified in development mode.'
        });
        return;
      }
      
      // Get origin from request or use default
      const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5003';
      
      try {
        // Send verification email
        await sendVerificationEmail(user, origin);
        console.log('Verification email sent successfully');
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue with registration even if email fails
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        message: 'Registration successful! Please check your email to verify your account.'
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      // Check if user is verified (skip in development)
      if (!user.isVerified && process.env.NODE_ENV === 'production') {
        return res.status(401).json({ 
          message: 'Please verify your email before logging in',
          needsVerification: true,
          email: user.email,
          userId: user._id
        });
      }
      
      // If not verified in development, auto-verify
      if (!user.isVerified && process.env.NODE_ENV !== 'production') {
        user.isVerified = true;
        await user.save();
        console.log('Development mode: User automatically verified during login');
      }
      
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email
// @route   GET /api/users/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user verification status
    user.isVerified = true;
    await user.save();
    
    // Send welcome email
    try {
      await sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue even if welcome email fails
    }
    
    res.json({ 
      message: 'Email verified successfully! You can now log in.',
      verified: true
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(400).json({ message: 'Invalid or expired verification token' });
  }
};

// @desc    Resend verification email
// @route   POST /api/users/resend-verification
// @access  Public
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('Resend verification request for email:', email);
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isVerified) {
      console.log('User is already verified:', email);
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // For development purposes, just mark the user as verified
    if (process.env.NODE_ENV !== 'production') {
      console.log('Development mode: Automatically verifying user without sending email');
      user.isVerified = true;
      await user.save();
      return res.json({ 
        message: 'Development mode: Your account has been automatically verified.',
        verified: true
      });
    }
    
    // Get origin from request or use default
    const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5003';
    
    try {
      // Send verification email
      await sendVerificationEmail(user, origin);
      console.log('Verification email sent successfully to:', email);
      res.json({ message: 'Verification email sent successfully' });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // In development, still allow verification even if email fails
      if (process.env.NODE_ENV !== 'production') {
        user.isVerified = true;
        await user.save();
        return res.json({ 
          message: 'Development mode: Your account has been automatically verified (email sending failed).',
          verified: true
        });
      } else {
        throw emailError;
      }
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to process verification request. Please try again.' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        phone: user.phone || '',
        address: user.address || {}
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Update basic info
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      
      // Update address if provided
      if (req.body.address) {
        user.address = {
          street: req.body.address.street || user.address?.street || '',
          city: req.body.address.city || user.address?.city || '',
          state: req.body.address.state || user.address?.state || '',
          postalCode: req.body.address.postalCode || user.address?.postalCode || '',
          country: req.body.address.country || user.address?.country || ''
        };
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        phone: updatedUser.phone || '',
        address: updatedUser.address || {},
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user password
// @route   PUT /api/users/profile/password
// @access  Private
const updateUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const keyword = req.query.keyword || '';
    const role = req.query.role || '';
    
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

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  getUsers,
  verifyEmail,
  resendVerificationEmail
};
