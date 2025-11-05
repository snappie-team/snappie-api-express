const express = require('express');
const router = express.Router();

// Import controllers
const {
  upload,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  getImageInfo
} = require('../controllers/ImageUploadController');

// Import middleware
const { authenticate } = require('../middleware/auth');

/**
 * Protected Routes (require authentication)
 */

// Upload single image
router.post('/image', authenticate, upload.single('image'), uploadImage);

// Upload multiple images
router.post('/images', authenticate, upload.array('images', 10), uploadMultipleImages);

// Delete image
router.delete('/image/:filename', authenticate, deleteImage);

/**
 * Public Routes
 */

// Get image info
router.get('/image/:filename/info', getImageInfo);

module.exports = router;