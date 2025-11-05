const { validationResult } = require('express-validator');
const ReviewService = require('../services/ReviewService');
const GamificationService = require('../services/GamificationService');

/**
 * Create checkin
 * @route POST /api/v1/gamification/checkin
 * @access Private (Auth required)
 */
const createCheckin = async (req, res) => {
  try {
    // Validasi request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const user_id = req.user.id;
    const { place_id, latitude, longitude, proof_image_url, additional_info } = req.body;

    const result = await GamificationService.createCheckin(user_id, {
      place_id,
      latitude,
      longitude,
      proof_image_url,
      additional_info,
    });

    return res.status(201).json({
      success: true,
      message: 'Checkin created successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error in createCheckin:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: status === 500 ? 'Internal server error' : error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Create review
 * @route POST /api/v1/gamification/review
 * @access Private (Auth required)
 */
const createReview = async (req, res) => {
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

    const { 
      place_id, rating, content, image_urls, 
      price_rating, quality_rating 
    } = req.body;
    const user_id = req.user.id;

    const reviewData = {
      user_id,
      place_id,
      rating,
      content,
      image_urls: image_urls || [],
      price_rating,
      quality_rating
    };

    const result = await ReviewService.createReview(reviewData);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in createReview:', error);
    
    if (error.message === 'Place not found') {
      return res.status(404).json({
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
 * Get user coin transactions
 * @route GET /api/v1/gamification/coins/transactions
 * @access Private (Auth required)
 */
const getCoinTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const user_id = req.user.id;

    const result = await GamificationService.getCoinTransactions(user_id, { page, limit, type });
    return res.status(200).json({
      success: true,
      message: 'Coin transactions retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error in getCoinTransactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get user exp transactions
 * @route GET /api/v1/gamification/exp/transactions
 * @access Private (Auth required)
 */
const getExpTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const user_id = req.user.id;

    const result = await GamificationService.getExpTransactions(user_id, { page, limit, type });
    return res.status(200).json({
      success: true,
      message: 'Experience transactions retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error in getExpTransactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get available achievements
 * @route GET /api/v1/gamification/achievements
 * @access Private (Auth required)
 */
const getAchievements = async (req, res) => {
  try {
    const user_id = req.user.id;
    const achievements = await GamificationService.getAchievements(user_id);
    return res.status(200).json({
      success: true,
      message: 'Achievements retrieved successfully',
      data: achievements,
    });
  } catch (error) {
    console.error('Error in getAchievements:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get available challenges
 * @route GET /api/v1/gamification/challenges
 * @access Private (Auth required)
 */
const getChallenges = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { status = 'active' } = req.query;
    const challenges = await GamificationService.getChallenges(user_id, { status });
    return res.status(200).json({
      success: true,
      message: 'Challenges retrieved successfully',
      data: challenges,
    });
  } catch (error) {
    console.error('Error in getChallenges:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get available rewards
 * @route GET /api/v1/gamification/rewards
 * @access Private (Auth required)
 */
const getRewards = async (req, res) => {
  try {
    const { status } = req.query;
    const rewards = await GamificationService.getRewards({ status });
    return res.status(200).json({
      success: true,
      message: 'Rewards retrieved successfully',
      data: rewards,
    });
  } catch (error) {
    console.error('Error in getRewards:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Grant achievement to user
 * @route POST /api/v1/gamification/achievements/:achievement_id/grant
 * @access Private (Auth required)
 */
const grantAchievement = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { achievement_id } = req.params;

    console.log('Granting achievement:', { user_id, achievement_id });
    const result = await GamificationService.grantAchievement(user_id, achievement_id);
    
    console.log('Achievement granted successfully, sending response...');
    // Coba response sederhana dulu
    return res.status(200).json({
      success: true,
      message: 'Achievement granted successfully',
      data: { id: result.id, user_id: result.user_id, achievement_id: result.achievement_id },
    });
  } catch (error) {
    console.error('Error in grantAchievement:', error);
    
    if (error.message === 'User or achievement not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'You already have this achievement.') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Complete challenge for user
 * @route POST /api/v1/gamification/challenges/:challenge_id/complete
 * @access Private (Auth required)
 */
const completeChallenge = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { challenge_id } = req.params;

    const result = await GamificationService.completeChallenge(user_id, challenge_id);
    
    return res.status(200).json({
      success: true,
      message: 'Challenge completed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error in completeChallenge:', error);
    
    if (error.message === 'User or challenge not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'You already completed this challenge.') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Redeem reward for user
 * @route POST /api/v1/gamification/rewards/:reward_id/redeem
 * @access Private (Auth required)
 */
// Test endpoint sederhana untuk debugging
const testGrant = async (req, res) => {
  try {
    console.log('Test endpoint called');
    return res.status(200).json({
      success: true,
      message: 'Test endpoint working',
      data: { test: 'success' }
    });
  } catch (error) {
    console.error('Error in testGrant:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const redeemReward = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { reward_id } = req.params;

    const result = await GamificationService.redeemReward(user_id, reward_id);
    
    return res.status(200).json({
      success: true,
      message: 'Reward redeemed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error in redeemReward:', error);
    
    if (error.message === 'User or reward not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'Insufficient coins' || error.message === 'Reward out of stock') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
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
};