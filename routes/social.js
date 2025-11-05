const express = require('express');
const router = express.Router();

// Import controllers
const {
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
} = require('../controllers/SocialMediaController');

// Import middleware
const { authenticate } = require('../middleware/auth');

/**
 * All routes require authentication
 */

// Follow system endpoints
router.post('/follow/id/:user_id', authenticate, followUser);
router.post('/unfollow/id/:user_id', authenticate, unfollowUser);
router.get('/users/id/:user_id/followers', authenticate, getUserFollowers);
router.get('/users/id/:user_id/following', authenticate, getUserFollowing);

// Post endpoints
router.post('/posts', authenticate, createPost);
router.get('/posts', authenticate, getFeed);
router.get('/posts/following', authenticate, getFollowingFeed);
router.get('/posts/trending', authenticate, getTrendingFeed);
router.get('/posts/id/:post_id', authenticate, getPostById);

// Post interaction endpoints
router.post('/posts/id/:post_id/like', authenticate, togglePostLike);
router.post('/posts/id/:post_id/comments', authenticate, addPostComment);
router.get('/posts/id/:post_id/comments', authenticate, getPostComments);
router.get('/posts/id/:post_id/likes', authenticate, getPostLikes);

module.exports = router;