const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
  deletePlace,
  searchPlaces,
  getNearbyPlaces
} = require('../controllers/placeController');

// Import middleware
const { authenticate } = require('../middleware/auth');
const {
  validateCreatePlace,
  validateUpdatePlace,
  handleValidationErrors
} = require('../middleware/validation');

/**
 * Public Routes
 */

// Get all places with pagination and filtering
router.get('/', getAllPlaces);

// Search places
router.get('/search', searchPlaces);

// Get nearby places
router.get('/nearby', getNearbyPlaces);

// Get place by ID
router.get('/:id', getPlaceById);

/**
 * Protected Routes (require authentication)
 * Note: In a real application, you might want to add admin role checking
 * for create, update, and delete operations
 */

// Create new place
router.post('/',
  authenticate,
  validateCreatePlace,
  handleValidationErrors,
  createPlace
);

// Update place
router.put('/:id',
  authenticate,
  validateUpdatePlace,
  handleValidationErrors,
  updatePlace
);

// Delete place
router.delete('/:id',
  authenticate,
  deletePlace
);

module.exports = router;