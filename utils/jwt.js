const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {String} expiresIn - Token expiration time
 * @returns {String} JWT token
 */
const generateToken = (payload, expiresIn = null) => {
  const options = {};
  
  if (expiresIn) {
    options.expiresIn = expiresIn;
  } else {
    options.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Generate access token
 * @param {Object} user - User object
 * @returns {String} Access token
 */
const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    type: 'access'
  };

  return generateToken(payload, process.env.JWT_EXPIRES_IN);
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {String} Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    type: 'refresh'
  };

  return generateToken(payload, process.env.JWT_REFRESH_EXPIRES_IN);
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token tidak valid');
  }
};

/**
 * Decode JWT token without verification
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Token tidak dapat didecode');
  }
};

/**
 * Get token expiration date
 * @param {String} token - JWT token
 * @returns {Date} Expiration date
 */
const getTokenExpiration = (token) => {
  try {
    const decoded = decodeToken(token);
    return new Date(decoded.exp * 1000);
  } catch (error) {
    throw new Error('Tidak dapat mendapatkan expiration token');
  }
};

/**
 * Check if token is expired
 * @param {String} token - JWT token
 * @returns {Boolean} True if expired
 */
const isTokenExpired = (token) => {
  try {
    const expirationDate = getTokenExpiration(token);
    return new Date() > expirationDate;
  } catch (error) {
    return true;
  }
};

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpired
};