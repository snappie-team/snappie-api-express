const PlaceService = require('../services/PlaceService');
const { validateId } = require('../utils/validation');

/**
 * Get paginated places with optional filters
 * @route GET /api/v1/places
 * @access Protected
 */
const getWithFilters = async (req, res) => {
  try {
    const perPage = parseInt(req.query.per_page) || 10;

    let places;

    // Build filters conditionally (only include active ones)
    const filters = {};
    if (req.query.search) filters.search = String(req.query.search);
    if (req.query.min_rating) filters.minRating = parseFloat(req.query.min_rating);
    if (req.query.min_price && req.query.max_price) {
      filters.minPrice = parseInt(req.query.min_price);
      filters.maxPrice = parseInt(req.query.max_price);
    }
    if (req.query.partner !== undefined) filters.partnershipStatus = req.query.partner;
    if (req.query.active_only !== undefined) filters.status = req.query.active_only;
    if (req.query.latitude && req.query.longitude && req.query.radius) {
      filters.latitude = req.query.latitude;
      filters.longitude = req.query.longitude;
      filters.radius = req.query.radius;
    }
    if (req.query.page) filters.page = parseInt(req.query.page);
    if (Array.isArray(req.query.food_type)) {
      if (req.query.food_type.length > 0) filters.foodType = req.query.food_type;
    } else if (req.query.food_type) {
      const arr = String(req.query.food_type).split(',').filter(Boolean);
      if (arr.length > 0) filters.foodType = arr;
    }
    if (Array.isArray(req.query.place_value)) {
      if (req.query.place_value.length > 0) filters.placeValue = req.query.place_value;
    } else if (req.query.place_value) {
      const arr = String(req.query.place_value).split(',').filter(Boolean);
      if (arr.length > 0) filters.placeValue = arr;
    }
    
    places = await PlaceService.getWithMultipleFilters(filters, perPage);

    res.status(200).json({
      success: true,
      message: 'Places retrieved successfully',
      data: places.data,
      active_filters: filters,
      pagination: {
        current_page: places.current_page,
        per_page: places.per_page,
        total: places.total,
        last_page: places.last_page
      }
    });
  } catch (error) {
    console.error('Error in index:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve places',
      error: error.message
    });
  }
};

/**
 * Get a specific place by ID
 * @route GET /api/v1/places/:place_id
 * @access Protected
 */
const getById = async (req, res) => {
  try {
    const validation = validateId(req.params.place_id);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid place ID'
      });
    }

    const place = await PlaceService.getById(validation.id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Place retrieved successfully',
      data: place
    });
  } catch (error) {
    console.error('Error in show:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve place',
      error: error.message
    });
  }
};


/**
 * Get reviews by place ID
 * @route GET /api/v1/places/id/:place_id/reviews
 * @access Protected
 */
const getReviewsByPlaceId = async (req, res) => {
  try {
    const validation = validateId(req.params.place_id);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid place ID'
      });
    }

    // Extract pagination and sorting options from query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sort_by || 'created_at';
    const sortOrder = req.query.sort_order || 'DESC';

    const reviews = await PlaceService.getReviewsByPlaceId(validation.id, {
      page,
      limit,
      sort_by: sortBy,
      sort_order: sortOrder
    });

    res.status(200).json({
      success: true,
      message: 'Reviews retrieved successfully',
      data: reviews.data,
      pagination: {
        current_page: reviews.current_page,
        per_page: reviews.per_page,
        total: reviews.total,
        last_page: reviews.last_page
      }
    });
  } catch (error) {
    console.error('Error in getReviewsByPlaceId:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reviews',
      error: error.message
    });
  }
};

module.exports = {
  getWithFilters,
  getById,
  getReviewsByPlaceId,
};