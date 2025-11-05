/**
 * Base Service Class
 * Provides common functionality for all services
 */
class BaseService {
  constructor(model) {
    this.model = model;
  }

  /**
   * Find all records with optional filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findAll(options = {}) {
    try {
      return await this.model.findAll(options);
    } catch (error) {
      throw new Error(`Error finding records: ${error.message}`);
    }
  }

  /**
   * Find record by ID
   * @param {number} id - Record ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async findById(id, options = {}) {
    try {
      return await this.model.findByPk(id, options);
    } catch (error) {
      throw new Error(`Error finding record by ID: ${error.message}`);
    }
  }

  /**
   * Create new record
   * @param {Object} data - Record data
   * @returns {Promise<Object>}
   */
  async create(data) {
    try {
      return await this.model.create(data);
    } catch (error) {
      throw new Error(`Error creating record: ${error.message}`);
    }
  }

  /**
   * Update record by ID
   * @param {number} id - Record ID
   * @param {Object} data - Update data
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    try {
      const record = await this.model.findByPk(id);
      if (!record) {
        return null;
      }
      return await record.update(data);
    } catch (error) {
      throw new Error(`Error updating record: ${error.message}`);
    }
  }

  /**
   * Delete record by ID
   * @param {number} id - Record ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      const record = await this.model.findByPk(id);
      if (!record) {
        return false;
      }
      await record.destroy();
      return true;
    } catch (error) {
      throw new Error(`Error deleting record: ${error.message}`);
    }
  }

  /**
   * Find and count all records with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async findAndCountAll(options = {}) {
    try {
      return await this.model.findAndCountAll(options);
    } catch (error) {
      throw new Error(`Error finding and counting records: ${error.message}`);
    }
  }

  /**
   * Build pagination metadata
   * @param {number} count - Total count
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {Object}
   */
  buildPagination(count, page, limit) {
    const totalPages = Math.ceil(count / limit);
    return {
      currentPage: parseInt(page),
      totalPages,
      totalItems: count,
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }
}

module.exports = BaseService;