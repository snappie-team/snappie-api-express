const express = require('express');
const router = express.Router();

// Import controllers
const {
  searchUsers,
  getUserById,
  getUserProfile,
  updateUserProfile,
  getUserActivities,
  getUserStats,
} = require('../controllers/UserController');

// Import middleware
const { authenticate } = require('../middleware/auth');

/**
 * Protected Routes (require authentication)
*/

// Search users (must be before /:id route)
router.get('/search', authenticate, searchUsers);

// Get user by ID
router.get('/id/:user_id', authenticate, getUserById);

// Get current user profile
router.get('/profile', authenticate, getUserProfile);

// Update user profile
router.post('/profile', authenticate, updateUserProfile);

// Get user activities
router.get('/id/:user_id/activities', authenticate, getUserActivities);

// Get user stats
router.get('/id/:user_id/stats', authenticate, getUserStats);

module.exports = router;