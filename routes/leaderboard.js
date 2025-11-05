const express = require('express');
const router = express.Router();

// Import controllers
const {
  getTopUsers,
  getUserRank,
  getWeeklyLeaderboard,
  getMonthlyLeaderboard,
  getLeaderboardCategories
} = require('../controllers/LeaderboardController');

/**
 * Public Routes
 */

// Get leaderboard categories and periods
router.get('/categories', getLeaderboardCategories);

// Get top users leaderboard
router.get('/top-users', getTopUsers);

// Get weekly leaderboard
router.get('/weekly', getWeeklyLeaderboard);

// Get monthly leaderboard
router.get('/monthly', getMonthlyLeaderboard);

// Get user rank
router.get('/user-rank/id/:user_id', getUserRank);

module.exports = router;