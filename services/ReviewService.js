const BaseService = require('./BaseService');
const Review = require('../models/Review');
const User = require('../models/User');
const Place = require('../models/Place');
const { Op } = require('sequelize');

class ReviewService extends BaseService {
  constructor() {
    super(Review);
  }

  /**
   * Get reviews with pagination and filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>}
   */
  async getReviews(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        place_id,
        user_id,
        min_rating,
        max_rating,
        status = true,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = filters;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Apply filters
      if (place_id) {
        whereClause.place_id = place_id;
      }

      if (user_id) {
        whereClause.user_id = user_id;
      }

      if (status !== undefined) {
        whereClause.status = status === 'true' || status === true;
      }

      if (min_rating) {
        whereClause.rating = {
          ...whereClause.rating,
          [Op.gte]: parseInt(min_rating)
        };
      }

      if (max_rating) {
        whereClause.rating = {
          ...whereClause.rating,
          [Op.lte]: parseInt(max_rating)
        };
      }

      // Validate sort options
      const validSortFields = ['created_at', 'rating', 'total_like'];
      const validSortOrders = ['ASC', 'DESC'];
      
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const sortOrderValue = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

      const { count, rows: reviews } = await Review.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'username', 'imageUrl']
          },
          {
            model: Place,
            as: 'place',
            attributes: ['id', 'name', 'imageUrls']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortField, sortOrderValue]],
        distinct: true
      });

      return {
        reviews,
        pagination: this.buildPagination(count, page, limit)
      };
    } catch (error) {
      throw new Error(`Error getting reviews: ${error.message}`);
    }
  }

  /**
   * Create a new review
   * @param {Object} reviewData - Review data
   * @returns {Promise<Object>}
   */
  async createReview(reviewData) {
    try {
      const { user_id, place_id, rating, content, image_urls, additional_info } = reviewData;

      // Validate required fields
      if (!user_id || !place_id || !rating) {
        throw new Error('User ID, Place ID, and rating are required');
      }

      // Validate rating range
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Check if user exists
      const user = await User.findByPk(user_id);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if place exists
      const place = await Place.findByPk(place_id);
      if (!place) {
        throw new Error('Place not found');
      }

      // Check if user already reviewed this place
      const existingReview = await Review.findOne({
        where: {
          user_id,
          place_id,
          status: true
        }
      });

      if (existingReview) {
        throw new Error('User has already reviewed this place');
      }

      const review = await Review.create({
        user_id,
        place_id,
        rating,
        content,
        image_urls: image_urls || [],
        additional_info: additional_info || {},
        status: true
      });

      // Update place statistics
      await this.updatePlaceStatistics(place_id);

      return await Review.findByPk(review.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'username', 'imageUrl']
          },
          {
            model: Place,
            as: 'place',
            attributes: ['id', 'name']
          }
        ]
      });
    } catch (error) {
      throw new Error(`Error creating review: ${error.message}`);
    }
  }

  /**
   * Update a review
   * @param {number} reviewId - Review ID
   * @param {Object} updateData - Update data
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object>}
   */
  async updateReview(reviewId, updateData, userId) {
    try {
      const review = await Review.findByPk(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      // Check if user owns the review
      if (review.user_id !== userId) {
        throw new Error('Unauthorized to update this review');
      }

      const { rating, content, image_urls, additional_info } = updateData;

      // Validate rating if provided
      if (rating && (rating < 1 || rating > 5)) {
        throw new Error('Rating must be between 1 and 5');
      }

      const updatedReview = await review.update({
        ...(rating && { rating }),
        ...(content !== undefined && { content }),
        ...(image_urls && { image_urls }),
        ...(additional_info && { additional_info })
      });

      // Update place statistics if rating changed
      if (rating && rating !== review.rating) {
        await this.updatePlaceStatistics(review.place_id);
      }

      return await Review.findByPk(updatedReview.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'username', 'imageUrl']
          },
          {
            model: Place,
            as: 'place',
            attributes: ['id', 'name']
          }
        ]
      });
    } catch (error) {
      throw new Error(`Error updating review: ${error.message}`);
    }
  }

  /**
   * Delete a review (soft delete)
   * @param {number} reviewId - Review ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<boolean>}
   */
  async deleteReview(reviewId, userId) {
    try {
      const review = await Review.findByPk(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      // Check if user owns the review
      if (review.user_id !== userId) {
        throw new Error('Unauthorized to delete this review');
      }

      await review.update({ status: false });

      // Update place statistics
      await this.updatePlaceStatistics(review.place_id);

      return true;
    } catch (error) {
      throw new Error(`Error deleting review: ${error.message}`);
    }
  }

  /**
   * Get reviews by place ID
   * @param {number} placeId - Place ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getReviewsByPlace(placeId, options = {}) {
    try {
      return await this.getReviews({
        ...options,
        place_id: placeId
      });
    } catch (error) {
      throw new Error(`Error getting reviews by place: ${error.message}`);
    }
  }

  /**
   * Get reviews by user ID
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getReviewsByUser(userId, options = {}) {
    try {
      return await this.getReviews({
        ...options,
        user_id: userId
      });
    } catch (error) {
      throw new Error(`Error getting reviews by user: ${error.message}`);
    }
  }

  /**
   * Update place statistics (average rating and total reviews)
   * @param {number} placeId - Place ID
   * @returns {Promise<void>}
   */
  async updatePlaceStatistics(placeId) {
    try {
      const { sequelize } = require('../config/database');
      
      const stats = await Review.findOne({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
        ],
        where: {
          place_id: placeId,
          status: true
        },
        raw: true
      });

      const avgRating = parseFloat(stats.avgRating) || 0;
      const totalReviews = parseInt(stats.totalReviews) || 0;

      await Place.update(
        {
          avgRating: Math.round(avgRating * 100) / 100, // Round to 2 decimal places
          totalReview: totalReviews
        },
        {
          where: { id: placeId }
        }
      );
    } catch (error) {
      console.error('Error updating place statistics:', error);
      // Don't throw error to prevent review operations from failing
    }
  }

  /**
   * Like/Unlike a review
   * @param {number} reviewId - Review ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>}
   */
  async toggleLike(reviewId, userId) {
    try {
      const review = await Review.findByPk(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      // This would require a separate UserLike model/table
      // For now, just increment/decrement the total_like count
      // In a real implementation, you'd check if user already liked and toggle accordingly
      
      const updatedReview = await review.update({
        total_like: review.total_like + 1
      });

      return updatedReview;
    } catch (error) {
      throw new Error(`Error toggling review like: ${error.message}`);
    }
  }
}

module.exports = new ReviewService();