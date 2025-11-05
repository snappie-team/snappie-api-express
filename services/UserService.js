const BaseService = require('./BaseService');
const User = require('../models/User');
const UserFollow = require('../models/UserFollow');
const Post = require('../models/Post');
const Review = require('../models/Review');
const Checkin = require('../models/Checkin');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class UserService extends BaseService {
  constructor() {
    super(User);
  }

  /**
   * Get user profile attributes
   * @returns {Array}
   */
  getProfileAttributes() {
    return [
      'id', 'name', 'username', 'email', 'imageUrl', 'totalCoin', 'totalExp',
      'totalFollowing', 'totalFollower', 'totalCheckin', 'totalPost', 'totalArticle',
      'totalReview', 'totalAchievement', 'totalChallenge', 'status', 'lastLoginAt',
      'additionalInfo'
    ];
  }

  /**
   * Get user by ID with profile attributes
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async getUserProfile(userId) {
    try {
      return await User.findByPk(userId, {
        attributes: this.getProfileAttributes()
      });
    } catch (error) {
      throw new Error(`Error getting user profile: ${error.message}`);
    }
  }

  /**
   * Find user by email or username
   * @param {string} emailOrUsername - Email or username
   * @returns {Promise<Object|null>}
   */
  async findByEmailOrUsername(emailOrUsername) {
    try {
      return await User.findOne({
        where: {
          [Op.or]: [
            { email: emailOrUsername.toLowerCase() },
            { username: emailOrUsername }
          ]
        }
      });
    } catch (error) {
      throw new Error(`Error finding user by email or username: ${error.message}`);
    }
  }

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>}
   */
  async updateProfile(userId, updateData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const allowedFields = ['name', 'username', 'email', 'imageUrl', 'additionalInfo'];
      const filteredData = {};

      // Filter only allowed fields
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key];
        }
      });

      // Validate email format if provided
      if (filteredData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(filteredData.email)) {
          throw new Error('Invalid email format');
        }
        filteredData.email = filteredData.email.toLowerCase();
      }

      // Validate username if provided
      if (filteredData.username) {
        if (filteredData.username.length < 3 || filteredData.username.length > 50) {
          throw new Error('Username must be between 3 and 50 characters');
        }
        if (!/^[a-zA-Z0-9]+$/.test(filteredData.username)) {
          throw new Error('Username must contain only alphanumeric characters');
        }

        // Check if username is already taken by another user
        const existingUser = await User.findOne({
          where: {
            username: filteredData.username,
            id: { [Op.ne]: userId }
          }
        });
        if (existingUser) {
          throw new Error('Username is already taken');
        }
      }

      // Check if email is already taken by another user
      if (filteredData.email) {
        const existingUser = await User.findOne({
          where: {
            email: filteredData.email,
            id: { [Op.ne]: userId }
          }
        });
        if (existingUser) {
          throw new Error('Email is already taken');
        }
      }

      await user.update(filteredData);

      return await this.getUserProfile(userId);
    } catch (error) {
      throw new Error(`Error updating user profile: ${error.message}`);
    }
  }

  /**
   * Update last login timestamp
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async updateLastLogin(userId) {
    try {
      const user = await User.findByPk(userId);
      if (user) {
        await user.update({ lastLoginAt: new Date() });
      }
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't throw error to prevent login from failing
    }
  }

  /**
   * Follow/Unfollow a user
   * @param {number} followerId - Follower user ID
   * @param {number} followingId - Following user ID
   * @returns {Promise<Object>}
   */
  async toggleFollow(followerId, followingId) {
    try {
      if (followerId === followingId) {
        throw new Error('Cannot follow yourself');
      }

      // Check if users exist
      const [follower, following] = await Promise.all([
        User.findByPk(followerId),
        User.findByPk(followingId)
      ]);

      if (!follower || !following) {
        throw new Error('User not found');
      }

      // Check if already following
      const existingFollow = await UserFollow.findOne({
        where: {
          follower_id: followerId,
          following_id: followingId
        }
      });

      let isFollowing;
      if (existingFollow) {
        // Unfollow
        await existingFollow.destroy();
        isFollowing = false;

        // Update counters
        await Promise.all([
          follower.update({ totalFollowing: Math.max(0, follower.totalFollowing - 1) }),
          following.update({ totalFollower: Math.max(0, following.totalFollower - 1) })
        ]);
      } else {
        // Follow
        await UserFollow.create({
          follower_id: followerId,
          following_id: followingId
        });
        isFollowing = true;

        // Update counters
        await Promise.all([
          follower.update({ totalFollowing: follower.totalFollowing + 1 }),
          following.update({ totalFollower: following.totalFollower + 1 })
        ]);
      }

      return {
        isFollowing,
        followerCount: isFollowing ? following.totalFollower + 1 : following.totalFollower - 1,
        followingCount: isFollowing ? follower.totalFollowing + 1 : follower.totalFollowing - 1
      };
    } catch (error) {
      throw new Error(`Error toggling follow: ${error.message}`);
    }
  }

  /**
   * Get user followers
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getFollowers(userId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;

      const { count, rows: followers } = await UserFollow.findAndCountAll({
        where: { following_id: userId },
        include: [
          {
            model: User,
            as: 'follower',
            attributes: ['id', 'name', 'username', 'imageUrl']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      return {
        followers: followers.map(f => f.follower),
        pagination: this.buildPagination(count, page, limit)
      };
    } catch (error) {
      throw new Error(`Error getting followers: ${error.message}`);
    }
  }

  /**
   * Get user following
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getFollowing(userId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;

      const { count, rows: following } = await UserFollow.findAndCountAll({
        where: { follower_id: userId },
        include: [
          {
            model: User,
            as: 'following',
            attributes: ['id', 'name', 'username', 'imageUrl']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      return {
        following: following.map(f => f.following),
        pagination: this.buildPagination(count, page, limit)
      };
    } catch (error) {
      throw new Error(`Error getting following: ${error.message}`);
    }
  }

  /**
   * Get user activities (posts, reviews, checkins)
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getUserActivities(userId, options = {}) {
    try {
      const { page = 1, limit = 10, type } = options;
      const offset = (page - 1) * limit;

      // Prepare containers
      let posts = [];
      let reviews = [];
      let checkins = [];

      // Fetch by type or all grouped
      if (!type || type === 'posts') {
        posts = await Post.findAll({
          where: { user_id: userId, status: true },
          limit: type === 'posts' ? parseInt(limit) : parseInt(limit),
          offset: type === 'posts' ? parseInt(offset) : 0,
          order: [['created_at', 'DESC']]
        });
        posts = posts.map(p => ({ ...p.toJSON(), type: 'post' }));
      }

      if (!type || type === 'reviews') {
        reviews = await Review.findAll({
          where: { user_id: userId, status: true },
          limit: type === 'reviews' ? parseInt(limit) : parseInt(limit),
          offset: type === 'reviews' ? parseInt(offset) : 0,
          order: [['created_at', 'DESC']]
        });
        reviews = reviews.map(r => ({ ...r.toJSON(), type: 'review' }));
      }

      if (!type || type === 'checkins') {
        checkins = await Checkin.findAll({
          where: { user_id: userId, status: true },
          limit: type === 'checkins' ? parseInt(limit) : parseInt(limit),
          offset: type === 'checkins' ? parseInt(offset) : 0,
          order: [['created_at', 'DESC']]
        });
        checkins = checkins.map(c => ({ ...c.toJSON(), type: 'checkin' }));
      }

      // Count totals for pagination
      let totalCount = 0;
      if (!type) {
        const [postCount, reviewCount, checkinCount] = await Promise.all([
          Post.count({ where: { user_id: userId, status: true } }),
          Review.count({ where: { user_id: userId, status: true } }),
          Checkin.count({ where: { user_id: userId, status: true } })
        ]);
        totalCount = postCount + reviewCount + checkinCount;
      } else if (type === 'posts') {
        totalCount = await Post.count({ where: { user_id: userId, status: true } });
      } else if (type === 'reviews') {
        totalCount = await Review.count({ where: { user_id: userId, status: true } });
      } else if (type === 'checkins') {
        totalCount = await Checkin.count({ where: { user_id: userId, status: true } });
      }

      return {
        user_id: userId,
        activities: {
          posts,
          reviews,
          checkins
        },
        pagination: this.buildPagination(totalCount, page, limit)
      };
    } catch (error) {
      throw new Error(`Error getting user activities: ${error.message}`);
    }
  }

  /**
   * Get user statistics including totals and recent activity (last 30 days)
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  async getUserStats(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: [
          'id', 'name', 'username', 'totalCoin', 'totalExp',
          'totalFollowing', 'totalFollower', 'totalPost',
          'totalCheckin', 'totalReview'
        ]
      });

      if (!user) {
        throw new Error('User not found');
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [posts30, reviews30, checkins30] = await Promise.all([
        Post.count({ where: { user_id: userId, created_at: { [Op.gte]: thirtyDaysAgo } } }),
        Review.count({ where: { user_id: userId, created_at: { [Op.gte]: thirtyDaysAgo } } }),
        Checkin.count({ where: { user_id: userId, created_at: { [Op.gte]: thirtyDaysAgo } } })
      ]);

      return {
        user_info: {
          id: user.id,
          name: user.name,
          username: user.username
        },
        totals: {
          coins: user.totalCoin,
          experience: user.totalExp,
          followers: user.totalFollower,
          following: user.totalFollowing,
          posts: user.totalPost,
          checkins: user.totalCheckin,
          reviews: user.totalReview
        },
        recent_activity: {
          posts_last_30_days: posts30,
          reviews_last_30_days: reviews30,
          checkins_last_30_days: checkins30
        }
      };
    } catch (error) {
      throw new Error(`Error getting user stats: ${error.message}`);
    }
  }

  /**
   * Search users
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async searchUsers(searchTerm, options = {}) {
    try {
      const { page = 1, limit = 10, sort_by = 'name', sort_order = 'ASC' } = options;
      const offset = (page - 1) * limit;

      if (!searchTerm) {
        throw new Error('Search term is required');
      }

      // Validate sort options
      const validSortFields = ['name', 'username', 'totalFollower', 'totalFollowing', 'totalExp', 'totalPost'];
      const validSortOrders = ['ASC', 'DESC'];
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'name';
      const sortOrderValue = validSortOrders.includes(String(sort_order).toUpperCase()) ? String(sort_order).toUpperCase() : 'ASC';

      const { count, rows: users } = await User.findAndCountAll({
        where: {
          [Op.and]: [
            { status: true },
            {
              [Op.or]: [
                { name: { [Op.iLike]: `%${searchTerm}%` } },
                { username: { [Op.iLike]: `%${searchTerm}%` } }
              ]
            }
          ]
        },
        attributes: ['id', 'name', 'username', 'imageUrl', 'totalFollower', 'totalFollowing', 'totalExp', 'totalPost'],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortField, sortOrderValue]]
      });

      return {
        users,
        pagination: this.buildPagination(count, page, limit),
        searchTerm
      };
    } catch (error) {
      throw new Error(`Error searching users: ${error.message}`);
    }
  }

  /**
   * Check if user is active
   * @param {Object} user - User instance
   * @returns {boolean}
   */
  isActive(user) {
    return user.status === true;
  }

  /**
   * Get user profile data
   * @param {Object} user - User instance
   * @returns {Object}
   */
  getProfile(user) {
    return user.toJSON();
  }

  /**
   * Update user statistics
   * @param {number} userId - User ID
   * @param {string} type - Type of statistic to update
   * @param {number} increment - Increment value (can be negative)
   * @returns {Promise<void>}
   */
  async updateStatistics(userId, type, increment = 1) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return;
      }

      const validTypes = [
        'totalCoin', 'totalExp', 'totalFollowing', 'totalFollower',
        'totalCheckin', 'totalPost', 'totalArticle', 'totalReview',
        'totalAchievement', 'totalChallenge'
      ];

      if (!validTypes.includes(type)) {
        throw new Error(`Invalid statistic type: ${type}`);
      }

      const currentValue = user[type] || 0;
      const newValue = Math.max(0, currentValue + increment);

      await user.update({ [type]: newValue });
    } catch (error) {
      console.error(`Error updating user statistics: ${error.message}`);
      // Don't throw error to prevent other operations from failing
    }
  }
}

module.exports = new UserService();