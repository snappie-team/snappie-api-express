const express = require('express');
const router = express.Router();

// Import controllers
const {
  createCheckin,
  createReview,
  getCoinTransactions,
  getExpTransactions,
  getAchievements,
  getChallenges,
  getRewards,
  grantAchievement,
  completeChallenge,
  redeemReward,
  testGrant
} = require('../controllers/GamificationController');

// Import middleware
const { authenticate } = require('../middleware/auth');

/**
 * All routes require authentication
 */

// Check-in endpoints
router.post('/checkin', authenticate, createCheckin);

// Review endpoints
router.post('/review', authenticate, createReview);

// Transaction endpoints
router.get('/coins/transactions', authenticate, getCoinTransactions);
router.get('/exp/transactions', authenticate, getExpTransactions);

// Achievement endpoints
router.get('/achievements', authenticate, getAchievements);

// Challenge endpoints
router.get('/challenges', authenticate, getChallenges);

// Reward endpoints
router.get('/rewards', authenticate, getRewards);

// Achievement action endpoints
router.post('/achievements/:achievement_id/grant', authenticate, grantAchievement);

// Challenge action endpoints
router.post('/challenges/:challenge_id/complete', authenticate, completeChallenge);

// Reward action endpoints
router.post('/rewards/:reward_id/redeem', authenticate, redeemReward);

// Test endpoint
router.post('/test-grant', authenticate, testGrant);

module.exports = router;