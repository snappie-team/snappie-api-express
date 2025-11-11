const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { parseAdditionalInfo } = require('../utils/jsonHelper');

const Reward = sequelize.define('Reward', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  coin_requirement: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'null means unlimited stock'
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ended_at: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'rewards',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Reward.associate = (models) => {
  Reward.hasMany(models.UserReward, {
    foreignKey: 'reward_id',
    as: 'userRewards'
  });
};

module.exports = Reward;