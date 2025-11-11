const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { parseAdditionalInfo } = require('../utils/jsonHelper');

const UserChallenge = sequelize.define('UserChallenge', {
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
  challenge_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'challenges',
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
  tableName: 'user_challenges',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'challenge_id']
    }
  ]
});

// Associations
UserChallenge.associate = (models) => {
  UserChallenge.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  UserChallenge.belongsTo(models.Challenge, {
    foreignKey: 'challenge_id',
    as: 'challenge'
  });
};

module.exports = UserChallenge;