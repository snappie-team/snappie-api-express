const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { parseAdditionalInfo } = require('../utils/jsonHelper');

const UserAchievement = sequelize.define('UserAchievement', {
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
  achievement_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'achievements',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  tableName: 'user_achievements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'achievement_id']
    }
  ]
});

// Associations
UserAchievement.associate = (models) => {
  UserAchievement.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  UserAchievement.belongsTo(models.Achievement, {
    foreignKey: 'achievement_id',
    as: 'achievement'
  });
};

module.exports = UserAchievement;