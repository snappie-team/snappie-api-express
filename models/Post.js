const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 2000]
    }
  },
  image_urls: {
    type: DataTypes.JSON,
    allowNull: true
  },
  total_like: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_comment: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  additional_info: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'posts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Post.associate = (models) => {
  Post.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  Post.belongsTo(models.Place, {
    foreignKey: 'place_id',
    as: 'place'
  });
  
  Post.hasMany(models.UserLike, {
    foreignKey: 'related_to_id',
    as: 'likes',
    scope: {
      related_to_type: 'Post'
    }
  });
  
  Post.hasMany(models.UserComment, {
    foreignKey: 'related_to_id',
    as: 'comments',
    scope: {
      related_to_type: 'Post'
    }
  });
};

module.exports = Post;