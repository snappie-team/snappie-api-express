/**
 * Validation utilities for API
 */

/**
 * Validate and parse ID parameter
 * @param {string} id - ID parameter from request
 * @returns {Object} - { isValid: boolean, id: number|null, error: string|null }
 */
const validateId = (id) => {
  // Check if ID is provided
  if (!id) {
    return {
      isValid: false,
      id: null,
      error: 'ID is required'
    };
  }

  // Check if ID is a valid number
  const parsedId = parseInt(id, 10);
  
  if (isNaN(parsedId) || parsedId <= 0) {
    return {
      isValid: false,
      id: null,
      error: 'ID must be a positive integer'
    };
  }

  // Check if the parsed ID matches the original string (no decimal points, etc.)
  if (parsedId.toString() !== id.toString()) {
    return {
      isValid: false,
      id: null,
      error: 'ID must be a valid integer'
    };
  }

  return {
    isValid: true,
    id: parsedId,
    error: null
  };
};

/**
 * Validate and parse multiple IDs
 * @param {Array} ids - Array of ID strings
 * @returns {Object} - { isValid: boolean, ids: Array|null, error: string|null }
 */
const validateIds = (ids) => {
  if (!Array.isArray(ids)) {
    return {
      isValid: false,
      ids: null,
      error: 'IDs must be an array'
    };
  }

  const parsedIds = [];
  
  for (let i = 0; i < ids.length; i++) {
    const validation = validateId(ids[i]);
    if (!validation.isValid) {
      return {
        isValid: false,
        ids: null,
        error: `Invalid ID at index ${i}: ${validation.error}`
      };
    }
    parsedIds.push(validation.id);
  }

  return {
    isValid: true,
    ids: parsedIds,
    error: null
  };
};

/**
 * Middleware to validate ID parameter
 * @param {string} paramName - Name of the parameter to validate (default: 'id')
 */
const validateIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const validation = validateId(id);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }
    
    // Replace the string ID with parsed integer
    req.params[paramName] = validation.id;
    next();
  };
};

/**
 * Validate pagination parameters
 * @param {Object} query - Request query object
 * @returns {Object} - { page: number, limit: number, offset: number }
 */
const validatePagination = (query) => {
  let { page = 1, limit = 10 } = query;
  
  // Parse and validate page
  page = parseInt(page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }
  
  // Parse and validate limit
  limit = parseInt(limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = 10;
  }
  
  // Set maximum limit to prevent abuse
  if (limit > 100) {
    limit = 100;
  }
  
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

/**
 * Validate coordinate parameters
 * @param {string} latitude - Latitude string
 * @param {string} longitude - Longitude string
 * @returns {Object} - { isValid: boolean, lat: number|null, lng: number|null, error: string|null }
 */
const validateCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  if (isNaN(lat) || isNaN(lng)) {
    return {
      isValid: false,
      lat: null,
      lng: null,
      error: 'Invalid coordinates format'
    };
  }
  
  if (lat < -90 || lat > 90) {
    return {
      isValid: false,
      lat: null,
      lng: null,
      error: 'Latitude must be between -90 and 90'
    };
  }
  
  if (lng < -180 || lng > 180) {
    return {
      isValid: false,
      lat: null,
      lng: null,
      error: 'Longitude must be between -180 and 180'
    };
  }
  
  return {
    isValid: true,
    lat,
    lng,
    error: null
  };
};

module.exports = {
  validateId,
  validateIds,
  validateIdParam,
  validatePagination,
  validateCoordinates
};