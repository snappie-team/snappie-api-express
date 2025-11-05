const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CoinTransaction = sequelize.define('CoinTransaction', {
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
    allowNull: false,
    comment: 'ID of the related record (checkin_id, achievement_id, etc.)'
  },
  related_to_type: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Type of the related record (Checkin, Achievement, Challenge, etc.)'
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'coin_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
CoinTransaction.associate = (models) => {
  CoinTransaction.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

module.exports = CoinTransaction;