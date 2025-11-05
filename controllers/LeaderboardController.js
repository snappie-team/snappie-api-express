const User = require('../models/User');
const Leaderboard = require('../models/Leaderboard');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Get top users leaderboard
 * @route GET /api/v1/leaderboard/top-users
 * @access Public
 */
const getTopUsers = async (req, res) => {
  try {
    const {
      type = 'all_time',
      metric = 'totalExp',
      limit = 50,
      period
    } = req.query;

    let whereClause = {};
    let orderField = metric;

    // Handle time-based filtering
    if (type !== 'all_time' && period) {
      const now = new Date();
      let startDate;

      switch (type) {
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        whereClause.updated_at = { [Op.gte]: startDate };
      }
    }

    // Validate metric field
    const validMetrics = ['totalExp', 'totalCoin', 'totalCheckin', 'totalReview', 'totalPost'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid metric. Valid options: ' + validMetrics.join(', ')
      });
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: [
          'id', 'name', 'username', 'imageUrl',
          'totalExp', 'totalCoin', 'totalCheckin',
          'totalReview', 'totalPost'
        ],
      order: [[orderField, 'DESC']],
      limit: parseInt(limit)
    });

    // Add ranking to each user
    const rankedUsers = users.map((user, index) => ({
      rank: index + 1,
      ...user.toJSON()
    }));

    res.status(200).json({
      success: true,
      message: 'Top users leaderboard retrieved successfully',
      data: {
        leaderboard: rankedUsers,
        metadata: {
          type,
          metric,
          total_users: rankedUsers.length,
          generated_at: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error in getTopUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user rank
 * @route GET /api/v1/leaderboard/user-rank/:user_id
 * @access Public
 */
const getUserRank = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { metric = 'totalExp', type = 'all_time' } = req.query;

    // Validate metric field
    const validMetrics = ['totalExp', 'totalCoin', 'totalCheckin', 'totalReview', 'totalPost'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid metric. Valid options: ' + validMetrics.join(', ')
      });
    }

    // Get the user
    const user = await User.findByPk(user_id, {
      attributes: [
        'id', 'name', 'username', 'imageUrl',
        'totalExp', 'totalCoin', 'totalCheckin',
        'totalReview', 'totalPost'
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate user's rank
    const userMetricValue = user[metric];
    const rank = await User.count({
      where: {
        [metric]: { [Op.gt]: userMetricValue }
      }
    }) + 1;

    // Get total users count
    const totalUsers = await User.count();

    // Get users around this user's rank (for context)
    const contextLimit = 5;
    const contextUsers = await User.findAll({
      attributes: [
          'id', 'name', 'username', 'imageUrl',
          'totalExp', 'totalCoin', 'totalCheckin',
          'totalReview', 'totalPost'
        ],
      order: [[metric, 'DESC']],
      limit: contextLimit * 2 + 1,
      offset: Math.max(0, rank - contextLimit - 1)
    });

    // Add ranking to context users
    const rankedContextUsers = contextUsers.map((contextUser, index) => ({
      rank: Math.max(1, rank - contextLimit) + index,
      ...contextUser.toJSON(),
      is_current_user: contextUser.id === parseInt(user_id)
    }));

    res.status(200).json({
      success: true,
      message: 'User rank retrieved successfully',
      data: {
        user_rank: {
          rank,
          total_users: totalUsers,
          percentile: Math.round((1 - (rank - 1) / totalUsers) * 100),
          user: user.toJSON()
        },
        context: rankedContextUsers,
        metadata: {
          metric,
          type,
          generated_at: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error in getUserRank:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get weekly leaderboard
 * @route GET /api/v1/leaderboard/weekly
 * @access Public
 */
const getWeeklyLeaderboard = async (req, res) => {
  try {
    const { metric = 'totalExp', limit = 50 } = req.query;

    // Get start of current week (Monday)
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // For weekly leaderboard, we need to calculate gains since start of week
    // This is a simplified version - in production, you'd want to track weekly stats separately
    const users = await User.findAll({
      attributes: [
          'id', 'name', 'username', 'imageUrl',
          'totalExp', 'totalCoin', 'totalCheckin',
          'totalReview', 'totalPost'
        ],
      where: {
        updated_at: { [Op.gte]: startOfWeek }
      },
      order: [[metric, 'DESC']],
      limit: parseInt(limit)
    });

    // Add ranking to each user
    const rankedUsers = users.map((user, index) => ({
      rank: index + 1,
      ...user.toJSON()
    }));

    res.status(200).json({
      success: true,
      message: 'Weekly leaderboard retrieved successfully',
      data: {
        leaderboard: rankedUsers,
        metadata: {
          type: 'weekly',
          metric,
          period: {
            start: startOfWeek,
            end: new Date()
          },
          total_users: rankedUsers.length,
          generated_at: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error in getWeeklyLeaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get monthly leaderboard
 * @route GET /api/v1/leaderboard/monthly
 * @access Public
 */
const getMonthlyLeaderboard = async (req, res) => {
  try {
    const { metric = 'totalExp', limit = 50 } = req.query;

    // Get start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // For monthly leaderboard, we need to calculate gains since start of month
    // This is a simplified version - in production, you'd want to track monthly stats separately
    const users = await User.findAll({
      attributes: [
          'id', 'name', 'username', 'imageUrl',
          'totalExp', 'totalCoin', 'totalCheckin',
          'totalReview', 'totalPost'
        ],
      where: {
        updated_at: { [Op.gte]: startOfMonth }
      },
      order: [[metric, 'DESC']],
      limit: parseInt(limit)
    });

    // Add ranking to each user
    const rankedUsers = users.map((user, index) => ({
      rank: index + 1,
      ...user.toJSON()
    }));

    res.status(200).json({
      success: true,
      message: 'Monthly leaderboard retrieved successfully',
      data: {
        leaderboard: rankedUsers,
        metadata: {
          type: 'monthly',
          metric,
          period: {
            start: startOfMonth,
            end: new Date()
          },
          total_users: rankedUsers.length,
          generated_at: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error in getMonthlyLeaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get leaderboard categories
 * @route GET /api/v1/leaderboard/categories
 * @access Public
 */
const getLeaderboardCategories = async (req, res) => {
  try {
    const categories = [
      {
        id: 'experience',
        name: 'Experience Points',
        description: 'Users ranked by total experience points earned',
        metric: 'totalExp',
        icon: '⭐'
      },
      {
        id: 'coins',
        name: 'Coins Collected',
        description: 'Users ranked by total coins collected',
        metric: 'totalCoin',
        icon: '🪙'
      },
      {
        id: 'checkins',
        name: 'Check-ins',
        description: 'Users ranked by number of place check-ins',
        metric: 'totalCheckin',
        icon: '📍'
      },
      {
        id: 'reviews',
        name: 'Reviews Written',
        description: 'Users ranked by number of reviews written',
        metric: 'totalReview',
        icon: '⭐'
      },
      {
        id: 'posts',
        name: 'Posts Created',
        description: 'Users ranked by number of posts created',
        metric: 'totalPost',
        icon: '📝'
      }
    ];

    const periods = [
      {
        id: 'all_time',
        name: 'All Time',
        description: 'Rankings based on all-time statistics'
      },
      {
        id: 'monthly',
        name: 'This Month',
        description: 'Rankings for the current month'
      },
      {
        id: 'weekly',
        name: 'This Week',
        description: 'Rankings for the current week'
      }
    ];

    res.status(200).json({
      success: true,
      message: 'Leaderboard categories retrieved successfully',
      data: {
        categories,
        periods
      }
    });
  } catch (error) {
    console.error('Error in getLeaderboardCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getTopUsers,
  getUserRank,
  getWeeklyLeaderboard,
  getMonthlyLeaderboard,
  getLeaderboardCategories
};