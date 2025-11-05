const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class Place extends Model {
  // Instance methods
  isActive() {
    return this.status === true;
  }

  isPartner() {
    return this.partnershipStatus === true;
  }

  getLocation() {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }

  // Static methods
  static async findByName(name) {
    return await Place.findOne({
      where: {
        name: {
          [sequelize.Sequelize.Op.iLike]: `%${name}%`,
        },
      },
    });
  }

  static async findNearby(latitude, longitude, radius = 5) {
    // Validasi input
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || radius <= 0) {
      return [];
    }

    try {
      return await Place.findAll({
        attributes: {
          include: [
            [
              sequelize.literal(`
              6371 * acos(
                cos(radians(${sequelize.escape(latitude)})) * 
                cos(radians(latitude)) * 
                cos(radians(longitude) - radians(${sequelize.escape(
                  longitude
                )})) + 
                sin(radians(${sequelize.escape(latitude)})) * 
                sin(radians(latitude))
              )
            `),
              "distance",
            ],
          ],
        },
        where: sequelize.literal(`
        6371 * acos(
          cos(radians(${sequelize.escape(latitude)})) * 
          cos(radians(latitude)) * 
          cos(radians(longitude) - radians(${sequelize.escape(longitude)})) + 
          sin(radians(${sequelize.escape(latitude)})) * 
          sin(radians(latitude))
        ) <= ${parseFloat(radius)}
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
      `),
        order: sequelize.literal("distance ASC"),
      });
    } catch (error) {
      console.error("Error in findNearby:", error);
      return [];
    }
  }
  static async findActiveOnly() {
    return await Place.findAll({
      where: {
        status: true,
      },
    });
  }
}

// Define the model
Place.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      validate: {
        min: -90,
        max: 90,
      },
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 6),
      allowNull: true,
      validate: {
        min: -180,
        max: 180,
      },
    },
    imageUrls: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      field: "image_urls",
    },
    coinReward: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "coin_reward",
      validate: {
        min: 0,
      },
    },
    expReward: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "exp_reward",
      validate: {
        min: 0,
      },
    },
    minPrice: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: "min_price",
      validate: {
        min: 0,
      },
    },
    maxPrice: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: "max_price",
      validate: {
        min: 0,
      },
    },
    avgRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.0,
      field: "avg_rating",
      validate: {
        min: 0,
        max: 5,
      },
    },
    totalReview: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "total_review",
      validate: {
        min: 0,
      },
    },
    totalCheckin: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "total_checkin",
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    partnershipStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "partnership_status",
    },
    additionalInfo: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        placeDetail: {
          shortDescription: "",
          address: "",
          openingHours: "",
          openingDays: [],
          contactNumber: "",
          website: "",
        },
        placeValue: [],
        foodType: [],
        placeAttributes: {
          menu: [],
          facility: [],
          parking: [],
          capacity: [],
          accessibility: [],
          payment: [],
          service: [],
        },
      },
      field: "additional_info",
    },
  },
  {
    sequelize,
    modelName: "Place",
    tableName: "places",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["name"],
      },
      {
        fields: ["latitude", "longitude"],
      },
      {
        fields: ["min_price", "max_price"],
      },
      {
        fields: ["avg_rating"],
      },
      {
        fields: ["total_review"],
      },
      {
        fields: ["total_checkin"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["partnership_status"],
      },
      {
        fields: ["created_at"],
      },
    ],
  }
);

// Associations
Place.associate = (models) => {
  // Posts
  Place.hasMany(models.Post, {
    foreignKey: "place_id",
    as: "posts",
  });

  // Reviews
  Place.hasMany(models.Review, {
    foreignKey: "place_id",
    as: "reviews",
  });

  // Checkins
  Place.hasMany(models.Checkin, {
    foreignKey: "place_id",
    as: "checkins",
  });
};

module.exports = Place;
