const express = require('express');
const { sequelize } = require('../config/database');
const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Check database connection
    let dbStatus = 'disconnected';
    let dbName = 'unknown';
    
    try {
      await sequelize.authenticate();
      dbStatus = 'connected';
      dbName = sequelize.config.database;
    } catch (dbError) {
      dbStatus = 'disconnected';
    }
    
    const healthData = {
      success: true,
      message: 'Snappie API Server is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: {
        status: dbStatus,
        name: dbName,
        type: 'PostgreSQL'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
      },
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth/*'
      }
    };

    res.status(200).json(healthData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;