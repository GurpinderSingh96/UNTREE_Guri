const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  updateUserPassword,
  getUsers,
  verifyEmail,
  resendVerificationEmail
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/', registerUser);
router.post('/login', loginUser);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.get('/manual-verify/:userId', async (req, res) => {
  try {
    // This is a development-only route for manual verification
    if (process.env.NODE_ENV !== 'production') {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      user.isVerified = true;
      await user.save();
      
      return res.json({ 
        message: 'Email verified successfully! You can now log in.',
        verified: true
      });
    }
    
    return res.status(404).json({ message: 'Route not found' });
  } catch (error) {
    console.error('Manual verification error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Protected routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router.put('/profile/password', protect, updateUserPassword);

// Admin routes
router.route('/admin/users')
  .get(protect, admin, getUsers);

module.exports = router;
