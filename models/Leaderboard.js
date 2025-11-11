const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { parseAdditionalInfo } = require('../utils/jsonHelper');

const Leaderboard = sequelize.define('Leaderboard', {
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
  type: {
    type: DataTypes.ENUM('weekly', 'monthly', 'yearly', 'all_time', 'custom'),
    allowNull: false
  },
  metric: {
    type: DataTypes.ENUM('total_exp', 'total_coins', 'checkins_count', 'reviews_count', 'posts_count'),
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  max_participants: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: 'Maximum number of users to show in leaderboard'
  },
  reward_config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Rewards for top positions'
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
  tableName: 'leaderboards',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Leaderboard;