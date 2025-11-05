const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Checkin = sequelize.define('Checkin', {
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
  latitude: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  additional_info: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'checkins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Checkin.associate = (models) => {
  Checkin.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  Checkin.belongsTo(models.Place, {
    foreignKey: 'place_id',
    as: 'place'
  });
};

module.exports = Checkin;