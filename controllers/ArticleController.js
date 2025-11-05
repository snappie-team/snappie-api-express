const ArticleService = require('../services/ArticleService');
const { validationResult } = require('express-validator');

/**
 * Get all articles with pagination and filtering
 * @route GET /api/v1/articles
 * @access Public
 */
const getAllArticles = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      category: req.query.category,
      user_id: req.query.user_id,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order
    };

    const result = await ArticleService.getAllArticles(filters);

    res.status(200).json({
      success: true,
      message: 'Articles retrieved successfully',
      data: result.articles,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getAllArticles:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
/**
 * Get article by ID
 * @route GET /api/v1/articles/:id
 * @access Public
 */
const getArticleById = async (req, res) => {
  try {
    const { article_id } = req.params;

    const article = await ArticleService.getArticleById(article_id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Article retrieved successfully',
      data: article
    });
  } catch (error) {
    console.error('Error in getArticleById:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
/**
 * Create new article
 * @route POST /api/v1/articles
 * @access Private (Auth required)
 */
const createArticle = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, category, content, image_urls } = req.body;
    const user_id = req.user.id;

    const articleData = {
      user_id,
      title,
      category,
      content,
      image_urls: image_urls || []
    };

    const article = await ArticleService.createArticle(articleData);

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article
    });
  } catch (error) {
    console.error('Error in createArticle:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update article
 * @route PUT /api/v1/articles/:id
 * @access Private (Auth required, owner only)
 */
const updateArticle = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { title, category, content, image_urls } = req.body;
    const user_id = req.user.id;

    const updateData = {
      title,
      category,
      content,
      image_urls
    };

    const article = await ArticleService.updateArticle(id, updateData, user_id);

    res.status(200).json({
      success: true,
      message: 'Article updated successfully',
      data: article
    });
  } catch (error) {
    console.error('Error in updateArticle:', error);
    
    if (error.message === 'Article not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'You are not authorized to update this article') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete article
 * @route DELETE /api/v1/articles/:id
 * @access Private (Auth required, owner only)
 */
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    await ArticleService.deleteArticle(id, user_id);

    res.status(200).json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteArticle:', error);
    
    if (error.message === 'Article not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'You are not authorized to delete this article') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
module.exports = {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
};