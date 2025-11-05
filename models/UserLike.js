const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserLike = sequelize.define('UserLike', {
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
  related_to_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  related_to_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, {
  tableName: 'user_likes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'related_to_id', 'related_to_type']
    }
  ]
});

// Associations
UserLike.associate = (models) => {
  UserLike.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

module.exports = UserLike;