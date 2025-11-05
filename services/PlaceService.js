const BaseService = require("./BaseService");
const Place = require("../models/Place");
const Review = require("../models/Review");
const User = require("../models/User");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");

class PlaceService extends BaseService {
  constructor() {
    super(Place);
  }

  /**
   * Get places with multiple filters (for testing multi-parameter support)
   * @param {Object} filters Filter object
   * @param {number} perPage Number of places per page
   * @returns {Promise<Object>}
   */
  async getWithMultipleFilters(filters = {}, perPage = 10) {
    try {
      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(perPage) || 10;
      const offset = (page - 1) * limit;

      // Base where clause
      const whereClause = {};

      if (filters.search) {
        whereClause.name = { [Op.iLike]: `%${filters.search}%` };
      }

      if (filters.minRating) {
        whereClause.avgRating = { [Op.gte]: parseFloat(filters.minRating) };
      }

      if (filters.minPrice && filters.maxPrice) {
        whereClause.minPrice = { [Op.gte]: parseInt(filters.minPrice) };
        whereClause.maxPrice = { [Op.lte]: parseInt(filters.maxPrice) };
      }

      if (filters.partnershipStatus !== undefined) {
        whereClause.partnershipStatus = filters.partnershipStatus === 'true';
      }

      if (filters.status !== undefined) {
        whereClause.status = filters.status === 'true';
      }

      // Preferences via JSONB (AND semantics): must contain ALL requested values in each category
      if (filters.foodType && Array.isArray(filters.foodType) && filters.foodType.length > 0) {
        whereClause[Op.and] = whereClause[Op.and] || [];
        whereClause[Op.and].push({ additionalInfo: { [Op.contains]: { food_type: filters.foodType } } });
      }
      if (filters.placeValue && Array.isArray(filters.placeValue) && filters.placeValue.length > 0) {
        whereClause[Op.and] = whereClause[Op.and] || [];
        whereClause[Op.and].push({ additionalInfo: { [Op.contains]: { place_value: filters.placeValue } } });
      }

      // Nearby support
      let distanceWhereLiteral = null;
      let distanceOrderLiteral = null;
      const hasNearby = filters.latitude && filters.longitude && filters.radius;
      if (hasNearby) {
        const lat = parseFloat(filters.latitude);
        const lng = parseFloat(filters.longitude);
        const rad = parseFloat(filters.radius);

        const distanceFormula = `(
          6371 * acos(
            cos(radians(${lat})) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${lng})) + 
            sin(radians(${lat})) * 
            sin(radians(latitude))
          )
        )`;

        distanceWhereLiteral = sequelize.literal(`${distanceFormula} <= ${rad} AND latitude IS NOT NULL AND longitude IS NOT NULL`);
        distanceOrderLiteral = sequelize.literal(`${distanceFormula} ASC`);

        whereClause[Op.and] = whereClause[Op.and] || [];
        whereClause[Op.and].push(distanceWhereLiteral);
      }

      // Sort handling
      const sort = filters.sort || null; // e.g., 'most_popular', 'avgRating', 'minPrice', 'name', 'createdAt', 'distance'

      // Double-query for most_popular to avoid GROUP BY conflicts when including full reviews
      if (sort === 'most_popular') {
        const allPopular = await Place.findAll({
          where: whereClause,
          include: [
            {
              model: Review,
              as: 'reviews',
              attributes: [],
              required: false,
            },
          ],
          attributes: [[sequelize.fn('COUNT', sequelize.col('reviews.id')), 'reviews_count']],
          group: ['Place.id'],
          order: [[sequelize.literal('reviews_count'), 'DESC']],
          subQuery: false,
        });

        const total = allPopular.length;
        const pagedPopular = allPopular.slice(offset, offset + limit);
        const placeIds = pagedPopular.map(p => p.id);
        const countMap = new Map(pagedPopular.map(p => [p.id, parseInt(p.getDataValue('reviews_count')) || 0]));

        const detailed = await Place.findAll({
          where: { id: placeIds },
          include: [
            {
              model: Review,
              as: 'reviews',
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'name', 'email', 'imageUrl'],
                },
              ],
              attributes: ['id', 'rating', 'content', 'created_at', 'updated_at'],
              required: false,
            },
          ],
          subQuery: false,
        });

        // Reorder by popular order and attach reviews_count
        const ordered = placeIds.map(id => detailed.find(d => d.id === id)).filter(Boolean);
        const result = ordered.map(place => ({
          ...place.toJSON(),
          reviews_count: countMap.get(place.id) || 0,
        }));

        return {
          data: result,
          current_page: page,
          per_page: limit,
          total,
          last_page: Math.ceil(total / limit),
        };
      }

      // Single-query path for other sorts
      const order = [];
      if (sort === 'avgRating') order.push(['avgRating', 'DESC']);
      else if (sort === 'minPrice') order.push(['minPrice', 'ASC']);
      else if (sort === 'name') order.push(['name', 'ASC']);
      else if (sort === 'createdAt') order.push(['createdAt', 'DESC']);
      else if (sort === 'distance' && hasNearby && distanceOrderLiteral) order.push(distanceOrderLiteral);
      else order.push(['createdAt', 'DESC']);

      const places = await Place.findAll({
        where: whereClause,
        include: [
          {
            model: Review,
            as: 'reviews',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email', 'imageUrl'],
              },
            ],
            attributes: ['id', 'rating', 'content', 'created_at', 'updated_at'],
            required: false,
          },
        ],
        attributes: {
          include: [[sequelize.fn('COUNT', sequelize.col('reviews.id')), 'reviews_count']],
        },
        group: ['Place.id', 'reviews.id', 'reviews->user.id'],
        order,
        limit,
        offset,
        subQuery: false,
      });

      const result = places.map((place) => ({
        ...place.toJSON(),
        reviews_count: parseInt(place.getDataValue('reviews_count')) || 0,
      }));

      return {
        data: result,
        current_page: page,
        per_page: limit,
        total: result.length,
        last_page: Math.ceil(result.length / limit),
      };
    } catch (error) {
      throw new Error(`Error getting places with multiple filters: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      const place = await Place.findByPk(id, {
        include: [
          {
            model: Review,
            as: "reviews",
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "name", "email", "image_url"],
              },
            ],
            attributes: ["id", "rating", "content", "created_at", "updated_at"],
            required: false,
          },
        ],
        attributes: {
          include: [
            [
              sequelize.fn("COUNT", sequelize.col("reviews.id")),
              "reviews_count",
            ],
          ],
        },
        group: ["Place.id", "reviews.id", "reviews->user.id"],
      });

      if (!place) return null;

      const result = {
        ...place.toJSON(),
        reviews_count: parseInt(place.getDataValue("reviews_count")) || 0,
      };

      return result;
    } catch (error) {
      throw new Error(`Error getting place by ID: ${error.message}`);
    }
  }

    async getReviewsByPlaceId(id, options = {}) {
    try {
      const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'DESC' } = options;
      const offset = (page - 1) * limit;

      const { count, rows: reviews } = await Review.findAndCountAll({
        where: {
          place_id: id,
          status: true
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email", "image_url"],
          },
        ],
        attributes: ["id", "rating", "content", "created_at", "updated_at", "image_urls", "additional_info"],
        order: [[sort_by, sort_order]],
        limit,
        offset
      });

      return {
        data: reviews,
        current_page: page,
        per_page: limit,
        total: count,
        last_page: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error getting reviews by place ID: ${error.message}`);
    }
  }
}

module.exports = new PlaceService();
