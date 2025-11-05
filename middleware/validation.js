const { body, validationResult } = require('express-validator');
const { validateId, validatePagination, validateCoordinates } = require('../utils/validation');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    
    errors.array().forEach(error => {
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = [];
      }
      formattedErrors[error.path].push(error.msg);
    });

    return res.status(422).json({
      success: false,
      message: 'Validasi gagal',
      errors: formattedErrors
    });
  }
  
  next();
};

/**
 * Validation rules for user registration
 */
const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Format email tidak valid')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email maksimal 255 karakter'),
    
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama harus antara 2-100 karakter')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Nama hanya boleh mengandung huruf dan spasi'),
    
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username harus antara 3-50 karakter')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username hanya boleh mengandung huruf, angka, dan underscore'),
    
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('URL gambar harus valid')
    .isLength({ max: 500 })
    .withMessage('URL gambar maksimal 500 karakter'),
    
  handleValidationErrors
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email/username harus diisi')
    .trim(),
    
  body('remember')
    .optional()
    .isBoolean()
    .withMessage('Remember harus berupa boolean'),
    
  handleValidationErrors
];

/**
 * Validation rules for profile update
 */
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nama harus antara 2-255 karakter')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Nama hanya boleh mengandung huruf dan spasi'),
    
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('URL gambar harus valid')
    .isLength({ max: 500 })
    .withMessage('URL gambar maksimal 500 karakter'),
    
  body('additionalInfo.userDetail.bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio maksimal 500 karakter'),
    
  body('additionalInfo.userDetail.phone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Format nomor telepon tidak valid'),
    
  body('additionalInfo.userSettings.language')
    .optional()
    .isIn(['id', 'en'])
    .withMessage('Language harus id atau en'),
    
  body('additionalInfo.userSettings.theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme harus light atau dark'),
    
  handleValidationErrors
];

/**
 * Validation rules for creating a place
 */
const validateCreatePlace = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nama tempat harus antara 2-255 karakter')
    .notEmpty()
    .withMessage('Nama tempat harus diisi'),
    
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Deskripsi maksimal 1000 karakter'),
    
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude harus antara -90 dan 90'),
    
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude harus antara -180 dan 180'),
    
  body('imageUrls')
    .optional()
    .isArray()
    .withMessage('Image URLs harus berupa array'),
    
  body('imageUrls.*')
    .optional()
    .isURL()
    .withMessage('Setiap image URL harus valid'),
    
  body('coinReward')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Coin reward harus berupa angka positif'),
    
  body('expReward')
    .optional()
    .isInt({ min: 0 })
    .withMessage('EXP reward harus berupa angka positif'),
    
  body('minPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Harga minimum harus berupa angka positif'),
    
  body('maxPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Harga maksimum harus berupa angka positif'),
    
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status harus berupa boolean'),
    
  body('partnershipStatus')
    .optional()
    .isBoolean()
    .withMessage('Partnership status harus berupa boolean'),
    
  body('additionalInfo')
    .optional()
    .isObject()
    .withMessage('Additional info harus berupa object'),

  handleValidationErrors
];

/**
 * Validation rules for updating a place
 */
const validateUpdatePlace = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nama tempat harus antara 2-255 karakter'),
    
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Deskripsi maksimal 1000 karakter'),
    
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude harus antara -90 dan 90'),
    
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude harus antara -180 dan 180'),
    
  body('imageUrls')
    .optional()
    .isArray()
    .withMessage('Image URLs harus berupa array'),
    
  body('imageUrls.*')
    .optional()
    .isURL()
    .withMessage('Setiap image URL harus valid'),
    
  body('coinReward')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Coin reward harus berupa angka positif'),
    
  body('expReward')
    .optional()
    .isInt({ min: 0 })
    .withMessage('EXP reward harus berupa angka positif'),
    
  body('minPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Harga minimum harus berupa angka positif'),
    
  body('maxPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Harga maksimum harus berupa angka positif'),
    
  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status harus berupa boolean'),
    
  body('partnershipStatus')
    .optional()
    .isBoolean()
    .withMessage('Partnership status harus berupa boolean'),
    
  body('additionalInfo')
    .optional()
    .isObject()
    .withMessage('Additional info harus berupa object'),

  handleValidationErrors
];

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
 * Middleware to validate user ID parameter
 */
const validateUserIdParam = validateIdParam('user_id');

/**
 * Middleware to validate place ID parameter
 */
const validatePlaceIdParam = validateIdParam('place_id');

/**
 * Middleware to validate post ID parameter
 */
const validatePostIdParam = validateIdParam('post_id');

/**
 * Middleware to validate article ID parameter
 */
const validateArticleIdParam = validateIdParam('article_id');

/**
 * Middleware to validate pagination query parameters
 */
const validatePaginationQuery = (req, res, next) => {
  const { page, limit, offset } = validatePagination(req.query);
  
  // Add validated pagination to request object
  req.pagination = { page, limit, offset };
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateCreatePlace,
  validateUpdatePlace,
  handleValidationErrors,
  validateIdParam,
  validateUserIdParam,
  validatePlaceIdParam,
  validatePostIdParam,
  validateArticleIdParam,
  validatePaginationQuery
};