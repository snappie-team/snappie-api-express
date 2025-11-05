const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserFollow = sequelize.define('UserFollow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  follower_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  following_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
}, {
  tableName: 'user_follows',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['follower_id', 'following_id']
    }
  ]
});

// Associations
UserFollow.associate = (models) => {
  UserFollow.belongsTo(models.User, {
    foreignKey: 'follower_id',
    as: 'follower'
  });
  
  UserFollow.belongsTo(models.User, {
    foreignKey: 'following_id',
    as: 'following'
  });
};

module.exports = UserFollow;