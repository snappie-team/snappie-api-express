const express = require('express');
const router = express.Router();

// Import controllers
const {
  getWithFilters,
  getById,
  getReviewsByPlaceId,
} = require('../controllers/placeController');

// Import middleware
const { authenticate } = require('../middleware/auth');

/**
 * Protected Routes (require authentication)
 * Note: In a real application, you might want to add admin role checking
 * for create, update, and delete operations
 */

// Get all places with pagination and filtering
router.get('/', authenticate, getWithFilters);

// Get place by ID
router.get('/id/:place_id', authenticate, getById);

router.get('/id/:place_id/reviews', authenticate, getReviewsByPlaceId);

module.exports = router;