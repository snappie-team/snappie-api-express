const { Sequelize } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_CONNECTION,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

// Function to connect to database
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ ${process.env.DB_CONNECTION} connected successfully`);
    
    // Use existing database structure without syncing
    // await sequelize.sync({ alter: true });
    console.log('✅ Using existing database structure');
  } catch (error) {
    console.error(`❌ Unable to connect to ${process.env.DB_CONNECTION} database:`, error.message);
    console.log('⚠️  Server will continue running without database connection');
    // Don't exit the process, allow server to run for endpoint testing
    // process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Gracefully shutting down...');
  try {
    await sequelize.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
  process.exit(0);
});

module.exports = { sequelize, connectDB };