const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { parseAdditionalInfo } = require('../utils/jsonHelper');

const UserReward = sequelize.define('UserReward', {
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
  reward_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'rewards',
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
  tableName: 'user_rewards',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
UserReward.associate = (models) => {
  UserReward.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  UserReward.belongsTo(models.Reward, {
    foreignKey: 'reward_id',
    as: 'reward'
  });
};

module.exports = UserReward;