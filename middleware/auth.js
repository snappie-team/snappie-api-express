const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Akses ditolak.'
      });
    }

    // Check if token starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Format token tidak valid. Gunakan Bearer token.'
      });
    }

    // Extract token
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Akses ditolak.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if token type is access token
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Token type tidak valid.'
      });
    }

    // Find user by ID
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan.'
      });
    }

    // Check if user is active
    if (!user.isActive()) {
      return res.status(401).json({
        success: false,
        message: 'Akun telah dinonaktifkan. Silakan hubungi admin.'
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token sudah expired.'
      });
    }

    return res.status(401).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat verifikasi token.'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    
    if (decoded.type !== 'access') {
      return next();
    }

    const user = await User.findById(decoded.id);
    
    if (user && user.isActive()) {
      req.user = user;
      req.token = token;
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

/**
 * Check if user has specific role (for future use)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Login diperlukan.'
      });
    }

    // For now, all authenticated users have access
    // This can be extended with role-based access control
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize
};