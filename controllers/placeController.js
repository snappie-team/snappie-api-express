const Place = require('../models/Place');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

/**
 * Get all places with pagination and filtering
 * @route GET /api/v1/places
 * @access Public
 */
const getAllPlaces = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      partnership_status,
      min_rating,
      max_rating,
      min_price,
      max_price,
      latitude,
      longitude,
      radius = 5
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Apply filters
    if (search) {
      whereClause.name = {
        [Op.iLike]: `%${search}%`
      };
    }

    if (status !== undefined) {
      whereClause.status = status === 'true';
    }

    if (partnership_status !== undefined) {
      whereClause.partnershipStatus = partnership_status === 'true';
    }

    if (min_rating) {
      whereClause.avgRating = {
        ...whereClause.avgRating,
        [Op.gte]: parseFloat(min_rating)
      };
    }

    if (max_rating) {
      whereClause.avgRating = {
        ...whereClause.avgRating,
        [Op.lte]: parseFloat(max_rating)
      };
    }

    if (min_price) {
      whereClause.minPrice = {
        ...whereClause.minPrice,
        [Op.gte]: parseInt(min_price)
      };
    }

    if (max_price) {
      whereClause.maxPrice = {
        ...whereClause.maxPrice,
        [Op.lte]: parseInt(max_price)
      };
    }

    let orderClause = [['createdAt', 'DESC']];

    // If location is provided, order by distance
    if (latitude && longitude) {
      const { sequelize } = require('../config/database');
      orderClause = [
        sequelize.literal(`
          ST_Distance(
            ST_MakePoint(longitude, latitude)::geography,
            ST_MakePoint(${longitude}, ${latitude})::geography
          )
        `)
      ];

      // Add radius filter if location is provided
      if (radius) {
        const { sequelize: seq } = require('../config/database');
        whereClause[Op.and] = seq.literal(`
          ST_DWithin(
            ST_MakePoint(longitude, latitude)::geography,
            ST_MakePoint(${longitude}, ${latitude})::geography,
            ${radius * 1000}
          )
        `);
      }
    }

    const { count, rows: places } = await Place.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: orderClause
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      message: 'Places retrieved successfully',
      data: {
        places,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all places error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

/**
 * Get place by ID
 * @route GET /api/v1/places/:id
 * @access Public
 */
const getPlaceById = async (req, res) => {
  try {
    const { id } = req.params;

    const place = await Place.findByPk(id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Place retrieved successfully',
      data: {
        place
      }
    });
  } catch (error) {
    console.error('Get place by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

/**
 * Create new place
 * @route POST /api/v1/places
 * @access Private (Admin only)
 */
const createPlace = async (req, res) => {
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
      name,
      description,
      latitude,
      longitude,
      imageUrls,
      coinReward,
      expReward,
      minPrice,
      maxPrice,
      status,
      partnershipStatus,
      additionalInfo
    } = req.body;

    // Check if place with same name already exists
    const existingPlace = await Place.findOne({
      where: {
        name: {
          [Op.iLike]: name
        }
      }
    });

    if (existingPlace) {
      return res.status(409).json({
        success: false,
        message: 'Place dengan nama tersebut sudah ada'
      });
    }

    // Create new place
    const newPlace = await Place.create({
      name,
      description,
      latitude,
      longitude,
      imageUrls: imageUrls || [],
      coinReward: coinReward || 0,
      expReward: expReward || 0,
      minPrice: minPrice || 0,
      maxPrice: maxPrice || 0,
      status: status !== undefined ? status : true,
      partnershipStatus: partnershipStatus || false,
      additionalInfo: additionalInfo || {}
    });

    res.status(201).json({
      success: true,
      message: 'Place berhasil dibuat',
      data: {
        place: newPlace
      }
    });
  } catch (error) {
    console.error('Create place error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

/**
 * Update place
 * @route PUT /api/v1/places/:id
 * @access Private (Admin only)
 */
const updatePlace = async (req, res) => {
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

    const { id } = req.params;
    const {
      name,
      description,
      latitude,
      longitude,
      imageUrls,
      coinReward,
      expReward,
      minPrice,
      maxPrice,
      status,
      partnershipStatus,
      additionalInfo
    } = req.body;

    // Find place
    const place = await Place.findByPk(id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place tidak ditemukan'
      });
    }

    // Check if another place with same name exists (excluding current place)
    if (name && name !== place.name) {
      const existingPlace = await Place.findOne({
        where: {
          name: {
            [Op.iLike]: name
          },
          id: {
            [Op.ne]: id
          }
        }
      });

      if (existingPlace) {
        return res.status(409).json({
          success: false,
          message: 'Place dengan nama tersebut sudah ada'
        });
      }
    }

    // Update place
    const updatedPlace = await place.update({
      name: name || place.name,
      description: description !== undefined ? description : place.description,
      latitude: latitude !== undefined ? latitude : place.latitude,
      longitude: longitude !== undefined ? longitude : place.longitude,
      imageUrls: imageUrls !== undefined ? imageUrls : place.imageUrls,
      coinReward: coinReward !== undefined ? coinReward : place.coinReward,
      expReward: expReward !== undefined ? expReward : place.expReward,
      minPrice: minPrice !== undefined ? minPrice : place.minPrice,
      maxPrice: maxPrice !== undefined ? maxPrice : place.maxPrice,
      status: status !== undefined ? status : place.status,
      partnershipStatus: partnershipStatus !== undefined ? partnershipStatus : place.partnershipStatus,
      additionalInfo: additionalInfo !== undefined ? additionalInfo : place.additionalInfo
    });

    res.status(200).json({
      success: true,
      message: 'Place berhasil diupdate',
      data: {
        place: updatedPlace
      }
    });
  } catch (error) {
    console.error('Update place error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

/**
 * Delete place
 * @route DELETE /api/v1/places/:id
 * @access Private (Admin only)
 */
const deletePlace = async (req, res) => {
  try {
    const { id } = req.params;

    // Find place
    const place = await Place.findByPk(id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place tidak ditemukan'
      });
    }

    // Delete place
    await place.destroy();

    res.status(200).json({
      success: true,
      message: 'Place berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete place error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

/**
 * Search places by name or description
 * @route GET /api/v1/places/search
 * @access Public
 */
const searchPlaces = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter diperlukan'
      });
    }

    const places = await Place.findAll({
      where: {
        [Op.or]: [
          {
            name: {
              [Op.iLike]: `%${q}%`
            }
          },
          {
            description: {
              [Op.iLike]: `%${q}%`
            }
          }
        ],
        status: true
      },
      limit: parseInt(limit),
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: {
        places,
        query: q,
        count: places.length
      }
    });
  } catch (error) {
    console.error('Search places error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

/**
 * Get nearby places
 * @route GET /api/v1/places/nearby
 * @access Public
 */
const getNearbyPlaces = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5, limit = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude dan longitude diperlukan'
      });
    }

    const places = await Place.findNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius)
    );

    const limitedPlaces = places.slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Nearby places retrieved successfully',
      data: {
        places: limitedPlaces,
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        radius: parseFloat(radius),
        count: limitedPlaces.length
      }
    });
  } catch (error) {
    console.error('Get nearby places error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = {
  getAllPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
  deletePlace,
  searchPlaces,
  getNearbyPlaces
};