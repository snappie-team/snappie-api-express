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
    defaultValue: {
      userDetail: {
        bio: '',
        gender: '',
        dateOfBirth: '',
        phone: ''
      },
      userPreferences: {
        foodType: '',
        placeValue: ''
      },
      userSaved: {
        savedPlaces: [],
        savedPosts: [],
        savedArticles: []
      },
      userSettings: {
        language: 'id',
        theme: 'light'
      },
      userNotification: {
        pushNotification: true
      }
    },
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
    },
    {
      fields: ['name']
    },
    {
      fields: ['status']
    },
    {
      fields: ['total_coin']
    },
    {
      fields: ['total_exp']
    },
    {
      fields: ['last_login_at']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = User;