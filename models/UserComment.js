const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserComment = sequelize.define('UserComment', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 1000]
    }
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'user_comments',
      key: 'id'
    }
  },
}, {
  tableName: 'user_comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
UserComment.associate = (models) => {
  UserComment.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  UserComment.belongsTo(models.UserComment, {
    foreignKey: 'parent_id',
    as: 'parent'
  });
  
  UserComment.hasMany(models.UserComment, {
    foreignKey: 'parent_id',
    as: 'replies'
  });
};

module.exports = UserComment;