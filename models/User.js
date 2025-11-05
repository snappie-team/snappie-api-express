const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class User extends Model {
  // Instance methods
  isActive() {
    return this.status === true;
  }

  async updateLastLogin() {
    this.lastLoginAt = new Date();
    await this.save();
  }

  getProfile() {
    const profile = this.toJSON();
    return profile;
  }

  // Static methods
  static async findByEmailOrUsername(emailOrUsername) {
    return await User.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername }
        ]
      }
    });
  }
}

// Define the model
User.init({
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      isEmail: true
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase());
    }
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'image_url'
  },
  totalCoin: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_coin'
  },
  totalExp: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_exp'
  },
  totalFollowing: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_following'
  },
  totalFollower: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_follower'
  },
  totalCheckin: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_checkin'
  },
  totalPost: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_post'
  },
  totalArticle: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_article'
  },
  totalReview: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_review'
  },
  totalAchievement: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_achievement'
  },
  totalChallenge: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_challenge'
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login_at'
  },
  additionalInfo: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'additional_info'
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['username']
    }
  ]
});

// Associations
User.associate = (models) => {
  // Articles
  User.hasMany(models.Article, {
    foreignKey: 'user_id',
    as: 'articles'
  });
  
  // Posts
  User.hasMany(models.Post, {
    foreignKey: 'user_id',
    as: 'posts'
  });
  
  // Reviews
  User.hasMany(models.Review, {
    foreignKey: 'user_id',
    as: 'reviews'
  });
  
  // Checkins
  User.hasMany(models.Checkin, {
    foreignKey: 'user_id',
    as: 'checkins'
  });
  
  // Followers (users who follow this user)
  User.hasMany(models.UserFollow, {
    foreignKey: 'following_id',
    as: 'followers'
  });
  
  // Following (users this user follows)
  User.hasMany(models.UserFollow, {
    foreignKey: 'follower_id',
    as: 'following'
  });
  
  // Likes
  User.hasMany(models.UserLike, {
    foreignKey: 'user_id',
    as: 'likes'
  });
  
  // Comments
  User.hasMany(models.UserComment, {
    foreignKey: 'user_id',
    as: 'comments'
  });
  
  // Transactions
  User.hasMany(models.CoinTransaction, {
    foreignKey: 'user_id',
    as: 'coinTransactions'
  });
  
  User.hasMany(models.ExpTransaction, {
    foreignKey: 'user_id',
    as: 'expTransactions'
  });
  
  // Achievements
  User.hasMany(models.UserAchievement, {
    foreignKey: 'user_id',
    as: 'achievements'
  });
  
  // Challenges
  User.hasMany(models.UserChallenge, {
    foreignKey: 'user_id',
    as: 'challenges'
  });
  
  // Rewards
  User.hasMany(models.UserReward, {
    foreignKey: 'user_id',
    as: 'rewards'
  });
};

module.exports = User;