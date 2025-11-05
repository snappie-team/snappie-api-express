const BaseService = require('./BaseService');
const Article = require('../models/Article');
const User = require('../models/User');
const { Op } = require('sequelize');

class ArticleService extends BaseService {
  constructor() {
    super(Article);
  }

  /**
   * Get all articles with pagination and filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>}
   */
  async getAllArticles(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        category,
        user_id,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = filters;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Apply filters
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (category) {
        whereClause.category = category;
      }

      if (user_id) {
        whereClause.user_id = user_id;
      }

      // Validate sort options
      const validSortFields = ['created_at', 'updated_at', 'title', 'category'];
      const validSortOrders = ['ASC', 'DESC'];
      
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const sortOrderValue = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

      const { count, rows: articles } = await Article.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'username', 'imageUrl']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortField, sortOrderValue]],
        distinct: true
      });

      return {
        articles,
        pagination: this.buildPagination(count, page, limit)
      };
    } catch (error) {
      throw new Error(`Error getting all articles: ${error.message}`);
    }
  }

  /**
   * Get article by ID with author information
   * @param {number} articleId - Article ID
   * @returns {Promise<Object|null>}
   */
  async getArticleById(articleId) {
    try {
      return await Article.findByPk(articleId, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'username', 'imageUrl']
          }
        ]
      });
    } catch (error) {
      throw new Error(`Error getting article by ID: ${error.message}`);
    }
  }

  /**
   * Create a new article
   * @param {Object} articleData - Article data
   * @returns {Promise<Object>}
   */
  async createArticle(articleData) {
    try {
      const { user_id, title, category, content, image_urls } = articleData;

      // Validate required fields
      if (!user_id || !title || !category || !content) {
        throw new Error('User ID, title, category, and content are required');
      }

      // Validate title length
      if (title.length < 1 || title.length > 255) {
        throw new Error('Title must be between 1 and 255 characters');
      }

      // Validate category length
      if (category.length < 1 || category.length > 255) {
        throw new Error('Category must be between 1 and 255 characters');
      }

      // Validate content is not empty
      if (!content.trim()) {
        throw new Error('Content cannot be empty');
      }

      // Check if user exists
      const user = await User.findByPk(user_id);
      if (!user) {
        throw new Error('User not found');
      }

      const article = await Article.create({
        user_id,
        title: title.trim(),
        category: category.trim(),
        content: content.trim(),
        image_urls: image_urls || []
      });

      // Update user statistics
      await this.updateUserArticleCount(user_id, 1);

      return await this.getArticleById(article.id);
    } catch (error) {
      throw new Error(`Error creating article: ${error.message}`);
    }
  }

  /**
   * Update an article
   * @param {number} articleId - Article ID
   * @param {Object} updateData - Update data
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object>}
   */
  async updateArticle(articleId, updateData, userId) {
    try {
      const article = await Article.findByPk(articleId);
      if (!article) {
        throw new Error('Article not found');
      }

      // Check if user owns the article
      if (article.user_id !== userId) {
        throw new Error('Unauthorized to update this article');
      }

      const { title, category, content, image_urls } = updateData;

      // Validate fields if provided
      if (title !== undefined) {
        if (title.length < 1 || title.length > 255) {
          throw new Error('Title must be between 1 and 255 characters');
        }
      }

      if (category !== undefined) {
        if (category.length < 1 || category.length > 255) {
          throw new Error('Category must be between 1 and 255 characters');
        }
      }

      if (content !== undefined) {
        if (!content.trim()) {
          throw new Error('Content cannot be empty');
        }
      }

      const updatedArticle = await article.update({
        ...(title !== undefined && { title: title.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(content !== undefined && { content: content.trim() }),
        ...(image_urls !== undefined && { image_urls })
      });

      return await this.getArticleById(updatedArticle.id);
    } catch (error) {
      throw new Error(`Error updating article: ${error.message}`);
    }
  }

  /**
   * Delete an article
   * @param {number} articleId - Article ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<boolean>}
   */
  async deleteArticle(articleId, userId) {
    try {
      const article = await Article.findByPk(articleId);
      if (!article) {
        throw new Error('Article not found');
      }

      // Check if user owns the article
      if (article.user_id !== userId) {
        throw new Error('Unauthorized to delete this article');
      }

      await article.destroy();

      // Update user statistics
      await this.updateUserArticleCount(article.user_id, -1);

      return true;
    } catch (error) {
      throw new Error(`Error deleting article: ${error.message}`);
    }
  }

  /**
   * Get articles by category
   * @param {string} category - Category name
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getArticlesByCategory(category, options = {}) {
    try {
      return await this.getAllArticles({
        ...options,
        category
      });
    } catch (error) {
      throw new Error(`Error getting articles by category: ${error.message}`);
    }
  }

  /**
   * Get articles by user
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getArticlesByUser(userId, options = {}) {
    try {
      return await this.getAllArticles({
        ...options,
        user_id: userId
      });
    } catch (error) {
      throw new Error(`Error getting articles by user: ${error.message}`);
    }
  }

  /**
   * Search articles
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async searchArticles(searchTerm, options = {}) {
    try {
      if (!searchTerm) {
        throw new Error('Search term is required');
      }

      return await this.getAllArticles({
        ...options,
        search: searchTerm
      });
    } catch (error) {
      throw new Error(`Error searching articles: ${error.message}`);
    }
  }

  /**
   * Get article categories
   * @returns {Promise<Array>}
   */
  async getCategories() {
    try {
      const { sequelize } = require('../config/database');
      
      const categories = await Article.findAll({
        attributes: [
          'category',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['category'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        raw: true
      });

      return categories.map(cat => ({
        name: cat.category,
        count: parseInt(cat.count)
      }));
    } catch (error) {
      throw new Error(`Error getting categories: ${error.message}`);
    }
  }

  /**
   * Get popular articles (most recent)
   * @param {number} limit - Number of articles to return
   * @returns {Promise<Array>}
   */
  async getPopularArticles(limit = 10) {
    try {
      const articles = await Article.findAll({
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'username', 'imageUrl']
          }
        ],
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      return articles;
    } catch (error) {
      throw new Error(`Error getting popular articles: ${error.message}`);
    }
  }

  /**
   * Update user article count
   * @param {number} userId - User ID
   * @param {number} increment - Increment value (can be negative)
   * @returns {Promise<void>}
   */
  async updateUserArticleCount(userId, increment) {
    try {
      const user = await User.findByPk(userId);
      if (user) {
        const newCount = Math.max(0, (user.totalArticle || 0) + increment);
        await user.update({ totalArticle: newCount });
      }
    } catch (error) {
      console.error('Error updating user article count:', error);
      // Don't throw error to prevent article operations from failing
    }
  }

  /**
   * Validate article data
   * @param {Object} articleData - Article data to validate
   * @returns {Object} Validation result
   */
  validateArticleData(articleData) {
    const errors = [];
    const { title, category, content } = articleData;

    if (!title || title.trim().length === 0) {
      errors.push('Title is required');
    } else if (title.length > 255) {
      errors.push('Title must not exceed 255 characters');
    }

    if (!category || category.trim().length === 0) {
      errors.push('Category is required');
    } else if (category.length > 255) {
      errors.push('Category must not exceed 255 characters');
    }

    if (!content || content.trim().length === 0) {
      errors.push('Content is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new ArticleService();