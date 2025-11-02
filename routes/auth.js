const express = require('express');
const router = express.Router();

// Import controllers
const {
  register,
  login,
  logout,
  checkAuthStatus,
  getProfile,
  updateProfile
} = require('../controllers/authController');

// Import middleware
const { authenticate } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  handleValidationErrors
} = require('../middleware/validation');

/**
 * Public Routes
 */

// Register new user
router.post('/register', 
  validateRegister,
  handleValidationErrors,
  register
);

// Login user
router.post('/login',
  validateLogin,
  handleValidationErrors,
  login
);

/**
 * Protected Routes (require authentication)
 */

// Logout user
router.post('/logout',
  authenticate,
  logout
);

// Check authentication status
router.get('/status',
  authenticate,
  checkAuthStatus
);

// Get user profile
router.get('/profile',
  authenticate,
  getProfile
);

// Update user profile
router.put('/profile',
  authenticate,
  validateProfileUpdate,
  handleValidationErrors,
  updateProfile
);

module.exports = router;