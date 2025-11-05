const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllArticles,
  getArticleById,
} = require('../controllers/ArticleController');

// Import middleware
const { authenticate } = require('../middleware/auth');

/**
 * Protected Routes (require authentication)
 */

// Get all articles with pagination and filtering
router.get('/', authenticate, getAllArticles);

// Get article by ID
router.get('/id/:article_id', authenticate, getArticleById);

module.exports = router;