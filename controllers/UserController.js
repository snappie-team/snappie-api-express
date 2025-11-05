const UserService = require('../services/UserService');
const { validationResult } = require('express-validator');
const { validateId } = require('../utils/validation');

/**
 * Get user by ID
 * @route GET /api/v1/users/:id
 * @access Public
 */
const getUserById = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Validate ID
    const validation = validateId(user_id);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await UserService.getUserProfile(validation.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get current user profile
 * @route GET /api/v1/users/profile
 * @access Private (Auth required)
 */
const getUserProfile = async (req, res) => {
  try {
    const user_id = req.user.id;

    const user = await UserService.getUserProfile(user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get user activities (posts, reviews, checkins)
 * @route GET /api/v1/users/:id/activities
 * @access Public
 */
const getUserActivities = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 20, type } = req.query;

    const activities = await UserService.getUserActivities(user_id, {
      page: parseInt(page),
      limit: parseInt(limit),
      type
    });

    res.status(200).json({
      success: true,
      message: 'User activities retrieved successfully',
      data: activities
    });
  } catch (error) {
    console.error('Error in getUserActivities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/v1/users/profile
 * @access Private (Auth required)
 */
const updateUserProfile = async (req, res) => {
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

    const user_id = req.user.id;
    const { name, username, imageUrl, additionalInfo } = req.body;

    const updatedUser = await UserService.updateProfile(user_id, {
      ...(name !== undefined && { name }),
      ...(username !== undefined && { username }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(additionalInfo !== undefined && { additionalInfo })
    });

    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    // Map known validation errors to 400
    const isClientError =
      /Invalid|already taken|not found|required|must/i.test(error.message || '');
    res.status(isClientError ? 400 : 500).json({
      success: false,
      message: isClientError ? error.message : 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user statistics
 * @route GET /api/v1/users/:id/stats
 * @access Public
 */
const getUserStats = async (req, res) => {
  try {
    const { user_id } = req.params;
    const stats = await UserService.getUserStats(user_id);

    res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error in getUserStats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Search users
 * @route GET /api/v1/users/search
 * @access Public
 */
const searchUsers = async (req, res) => {
  try {
    const {
      q: query,
      page = 1,
      limit = 10,
      sort_by = 'name',
      sort_order = 'ASC'
    } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const result = await UserService.searchUsers(query, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort_by,
      sort_order
    });

    res.status(200).json({
      success: true,
      message: 'Users search completed successfully',
      data: {
        users: result.users,
        pagination: result.pagination
      }
    });
  } catch (error) {
    console.error('Error in searchUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  searchUsers,
  getUserById,
  getUserProfile,
  updateUserProfile,
  getUserActivities,
  getUserStats,
};