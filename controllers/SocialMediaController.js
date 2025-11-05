const { validationResult } = require('express-validator');
const SocialMediaService = require('../services/SocialMediaService');

/**
 * Follow a user
 * @route POST /api/v1/social/follow/:user_id
 * @access Private (Auth required)
 */
const followUser = async (req, res) => {
  try {
    const { user_id: target_user_id } = req.params;
    const follower_id = req.user.id;

    const result = await SocialMediaService.followUser(follower_id, target_user_id);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in followUser:', error);
    
    if (error.message === 'You cannot follow yourself') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'You are already following this user') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Unfollow a user
 * @route DELETE /api/v1/social/follow/:user_id
 * @access Private (Auth required)
 */
const unfollowUser = async (req, res) => {
  try {
    const { user_id: target_user_id } = req.params;
    const follower_id = req.user.id;

    const result = await SocialMediaService.unfollowUser(follower_id, target_user_id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in unfollowUser:', error);
    
    if (error.message === 'You are not following this user') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user's followers
 * @route GET /api/v1/social/users/:user_id/followers
 * @access Public
 */
const getUserFollowers = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await SocialMediaService.getUserFollowers(user_id, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getUserFollowers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user's following
 * @route GET /api/v1/social/users/:user_id/following
 * @access Public
 */
const getUserFollowing = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await SocialMediaService.getUserFollowing(user_id, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getUserFollowing:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a post
 * @route POST /api/v1/social/posts
 * @access Private (Auth required)
 */
const createPost = async (req, res) => {
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

    const { place_id, content, image_url } = req.body;
    const user_id = req.user.id;

    console.log('Received data:', { place_id, content, image_url, user_id });

    const result = await SocialMediaService.createPost(user_id, {
      place_id: place_id ? parseInt(place_id) : null,
      content: content || '',
      image_urls: image_url ? [image_url] : []
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createPost:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get posts feed (all posts, newest first)
 * @route GET /api/v1/social/posts
 * @access Private (Auth required)
 */
const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user_id = req.user.id;

    const result = await SocialMediaService.getFeed(user_id, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getFeed:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get following feed (posts from users you follow)
 * @route GET /api/v1/social/posts/following
 * @access Private (Auth required)
 */
const getFollowingFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user_id = req.user.id;

    const result = await SocialMediaService.getFollowingFeed(user_id, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getFollowingFeed:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get trending feed (posts with most interactions)
 * @route GET /api/v1/social/posts/trending
 * @access Private (Auth required)
 */
const getTrendingFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user_id = req.user.id;

    const result = await SocialMediaService.getTrendingFeed(user_id, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getTrendingFeed:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get post by ID
 * @route GET /api/v1/social/posts/id/:post_id
 * @access Private (Auth required)
 */
const getPostById = async (req, res) => {
  try {
    const { post_id } = req.params;
    const user_id = req.user.id;

    const result = await SocialMediaService.getPostById(user_id, post_id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getPostById:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Like/Unlike a post
 * @route POST /api/v1/social/posts/:post_id/like
 * @access Private (Auth required)
 */
const togglePostLike = async (req, res) => {
  try {
    const { post_id } = req.params;
    const user_id = req.user.id;

    const result = await SocialMediaService.togglePostLike(user_id, post_id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in togglePostLike:', error);
    
    if (error.message === 'Post not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Add comment to post
 * @route POST /api/v1/social/posts/:post_id/comments
 * @access Private (Auth required)
 */
const addPostComment = async (req, res) => {
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

    const { post_id } = req.params;
    const { content, parent_id } = req.body;
    const user_id = req.user.id;

    const result = await SocialMediaService.addPostComment(user_id, post_id, content, parent_id);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in addPostComment:', error);
    
    if (error.message === 'Post not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'Parent comment not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get post comments
 * @route GET /api/v1/social/posts/:post_id/comments
 * @access Public
 */
const getPostComments = async (req, res) => {
  try {
    const { post_id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await SocialMediaService.getPostComments(post_id, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getPostComments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all likes for a post
 * @route GET /api/v1/social/posts/:post_id/likes
 * @access Public
 */
const getPostLikes = async (req, res) => {
  try {
    const { post_id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await SocialMediaService.getPostLikes(post_id, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getPostLikes:', error);
    
    if (error.message === 'Post not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getUserFollowers,
  getUserFollowing,
  createPost,
  getFeed,
  getFollowingFeed,
  getTrendingFeed,
  getPostById,
  togglePostLike,
  addPostComment,
  getPostComments,
  getPostLikes
};