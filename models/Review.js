const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { parseAdditionalInfo } = require('../utils/jsonHelper');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  place_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'places',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  total_like: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  image_urls: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: { 
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  additional_info: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('additional_info');
      return parseAdditionalInfo(rawValue);
    }
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Review.associate = (models) => {
  Review.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  Review.belongsTo(models.Place, {
    foreignKey: 'place_id',
    as: 'place'
  });
};

module.exports = Review;