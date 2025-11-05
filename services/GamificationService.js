const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('../models/User');
const Place = require('../models/Place');
const Checkin = require('../models/Checkin');
const CoinTransaction = require('../models/CoinTransaction');
const ExpTransaction = require('../models/ExpTransaction');
const Achievement = require('../models/Achievement');
const Challenge = require('../models/Challenge');
const Reward = require('../models/Reward');
const UserAchievement = require('../models/UserAchievement');
const UserChallenge = require('../models/UserChallenge');
const UserReward = require('../models/UserReward');
const Review = require('../models/Review');

/**
 * GamificationService
 * Mengelola logika bisnis untuk fitur gamification (checkin, transaksi, achievements, challenges, rewards)
 */
class GamificationService {
  /**
   * Berikan koin kepada pengguna dan catat transaksinya.
   * Menggunakan database transaction untuk memastikan integritas data.
   * @param {number} user_id
   * @param {number} amount
   * @param {object} relatedObject - Objek yang menjadi sumber koin
   * @param {string} relatedObject.type - Tipe objek (e.g., 'Achievement', 'Checkin')
   * @param {number} relatedObject.id - ID objek
   * @returns {Promise<object>}
   */
  static async addCoins(user_id, amount, relatedObject) {
    if (amount <= 0) {
      throw new Error('Coin amount must be greater than 0.');
    }

    const transaction = await sequelize.transaction();
    try {
      const user = await User.findByPk(user_id, { transaction });
      if (!user) {
        throw new Error('User not found');
      }

      // Tambah total koin pengguna
      await user.increment('totalCoin', { by: amount, transaction });

      // Buat catatan transaksi
      const coinTransaction = await CoinTransaction.create({
        user_id,
        amount,
        related_to_id: relatedObject.id,
        related_to_type: relatedObject.type,
      }, { transaction });

      await transaction.commit();
      return coinTransaction;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Kurangi koin pengguna dan catat transaksinya.
   * @param {number} user_id
   * @param {number} amount
   * @param {object} relatedObject - Objek yang menjadi sumber pengurangan koin
   * @param {string} relatedObject.type - Tipe objek
   * @param {number} relatedObject.id - ID objek
   * @returns {Promise<object>}
   */
  static async useCoins(user_id, amount, relatedObject) {
    const user = await User.findByPk(user_id);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.totalCoin < amount) {
      throw new Error('User does not have enough coins.');
    }

    const transaction = await sequelize.transaction();
    try {
      // Kurangi total koin pengguna
      await user.decrement('totalCoin', { by: amount, transaction });

      // Buat catatan transaksi
      const coinTransaction = await CoinTransaction.create({
        user_id,
        amount: -amount,
        related_to_id: relatedObject.id,
        related_to_type: relatedObject.type,
      }, { transaction });

      await transaction.commit();
      return coinTransaction;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Berikan EXP kepada pengguna dan catat transaksinya.
   * @param {number} user_id
   * @param {number} amount
   * @param {object} relatedObject - Objek yang menjadi sumber EXP
   * @param {string} relatedObject.type - Tipe objek
   * @param {number} relatedObject.id - ID objek
   * @returns {Promise<object>}
   */
  static async addExp(user_id, amount, relatedObject) {
    if (amount <= 0) {
      throw new Error('EXP amount must be greater than zero.');
    }

    const transaction = await sequelize.transaction();
    try {
      const user = await User.findByPk(user_id, { transaction });
      if (!user) {
        throw new Error('User not found');
      }

      // Tambah total EXP pengguna
      await user.increment('totalExp', { by: amount, transaction });

      // Buat catatan transaksi
      const expTransaction = await ExpTransaction.create({
        user_id,
        amount,
        related_to_id: relatedObject.id,
        related_to_type: relatedObject.type,
      }, { transaction });

      await transaction.commit();
      return expTransaction;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  /**
   * Melakukan proses check-in untuk pengguna di sebuah tempat.
   * Menerapkan aturan: 1 check-in per tempat per bulan kalender.
   * @param {number} user_id
   * @param {object} payload - { place_id, latitude, longitude, proof_image_url, additional_info }
   * @returns {Promise<{ checkin: object, rewards: { coins_earned: number, exp_earned: number, new_level: number } }>} 
   */
  static async createCheckin(user_id, payload) {
    const transaction = await sequelize.transaction();
    try {
      const { place_id, latitude, longitude, proof_image_url, additional_info } = payload;

      // Pastikan tempat ada
      const place = await Place.findByPk(place_id, { transaction });
      if (!place) {
        await transaction.rollback();
        const err = new Error('Place not found');
        err.statusCode = 404;
        throw err;
      }

      // 1. Cek status tempat (place)
      if (!place.status) {
        await transaction.rollback();
        const err = new Error('This place is currently not active.');
        err.statusCode = 400;
        throw err;
      }

      // 2. Cek apakah pengguna sudah check-in di tempat ini pada bulan kalender yang sama
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const hasCheckedInThisMonth = await Checkin.findOne({
        where: {
          user_id,
          place_id,
          created_at: {
            [Op.gte]: startOfMonth,
            [Op.lte]: endOfMonth,
          },
        },
        transaction,
      });

      // 3. Jika sudah, lewati proses dan berikan pesan error
      if (hasCheckedInThisMonth) {
        await transaction.rollback();
        const err = new Error('You have already checked in at this place this month.');
        err.statusCode = 400;
        throw err;
      }

      // Hitung reward sederhana
      const coinsEarned = 10;
      const expEarned = 5;

      // Ambil user
      const user = await User.findByPk(user_id, { transaction });
      if (!user) {
        await transaction.rollback();
        const err = new Error('User not found');
        err.statusCode = 404;
        throw err;
      }

      // Buat checkin
      const checkin = await Checkin.create(
        {
          user_id,
          place_id,
          latitude,
          longitude,
          image_url: proof_image_url,
          additional_info: additional_info || {},
        },
        { transaction }
      );

      // Update statistik user
      const newCoinBalance = (user.totalCoin || 0) + coinsEarned;
      const newExpBalance = (user.totalExp || 0) + expEarned;
      const newCheckinsCount = (user.totalCheckin || 0) + 1;
      const newLevel = Math.floor(newExpBalance / 100) + 1; // perhitungan level sederhana

      await user.update(
        {
          totalCoin: newCoinBalance,
          totalExp: newExpBalance,
          totalCheckin: newCheckinsCount,
        },
        { transaction }
      );

      // Transaksi coin
      await CoinTransaction.create(
        {
          user_id,
          amount: coinsEarned,
          related_to_id: checkin.id,
          related_to_type: 'Checkin',
        },
        { transaction }
      );

      // Transaksi exp
      await ExpTransaction.create(
        {
          user_id,
          amount: expEarned,
          related_to_id: checkin.id,
          related_to_type: 'Checkin',
        },
        { transaction }
      );

      await transaction.commit();

      // Load checkin dengan info tempat
      const createdCheckin = await Checkin.findByPk(checkin.id, {
        include: [
          {
            model: Place,
            as: 'place',
            attributes: ['id', 'name', 'latitude', 'longitude'],
          },
        ],
      });

      return {
        checkin: createdCheckin,
        rewards: {
          coins_earned: coinsEarned,
          exp_earned: expEarned,
          new_level: newLevel,
        },
      };
    } catch (error) {
      // Jika belum di-commit, pastikan rollback
      try { await transaction.rollback(); } catch (_) {}
      throw error;
    }
  }

  /**
   * Menambahkan ulasan baru dan memastikan statistik tempat diperbarui.
   * @param {number} user_id
   * @param {number} place_id
   * @param {object} data - { content, rating, image_urls, additional_info }
   * @returns {Promise<object>}
   */
  static async createReview(user_id, place_id, data) {
    const transaction = await sequelize.transaction();
    try {
      const place = await Place.findByPk(place_id, { transaction });
      if (!place) {
        throw new Error('Place not found');
      }

      // 1. Cek status tempat (place)
      if (!place.status) {
        throw new Error('This place is currently not active.');
      }

      // 2. Cek apakah pengguna sudah review tempat ini pada bulan kalender yang sama
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const hasReviewedInThisMonth = await Review.findOne({
        where: {
          user_id,
          place_id,
          created_at: {
            [Op.gte]: startOfMonth,
            [Op.lte]: endOfMonth,
          },
        },
        transaction,
      });

      // 3. Jika sudah, lewati proses dan berikan pesan error
      if (hasReviewedInThisMonth) {
        throw new Error('You have already reviewed this place this month.');
      }

      // 4. Buat ulasan baru
      const review = await Review.create({
        user_id,
        place_id,
        content: data.content,
        rating: data.rating,
        image_urls: data.image_urls || null,
        additional_info: data.additional_info || {},
        status: true,
      }, { transaction });

      // Update statistik pengguna dan tempat
      await User.increment('totalReview', { by: 1, where: { id: user_id }, transaction });
      await Place.increment('totalReview', { by: 1, where: { id: place_id }, transaction });

      // Hitung ulang rata-rata rating
      const reviewStats = await Review.findOne({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'review_count'],
          [sequelize.fn('SUM', sequelize.col('rating')), 'total_rating']
        ],
        where: { place_id },
        transaction,
      });

      const newAvgRating = reviewStats.dataValues.review_count > 0
        ? reviewStats.dataValues.total_rating / reviewStats.dataValues.review_count
        : 0;

      await place.update({
        avgRating: Math.round(newAvgRating * 100) / 100
      }, { transaction });

      // Berikan reward (koin & EXP)
      await this.addCoins(user_id, place.coin_reward, { type: 'Review', id: review.id });
      await this.addExp(user_id, place.exp_reward, { type: 'Review', id: review.id });

      await transaction.commit();
      return review;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Memberikan achievement kepada pengguna jika belum dimiliki.
   * @param {number} user_id
   * @param {number} achievement_id
   * @returns {Promise<object>}
   */
  static async grantAchievement(user_id, achievement_id) {
    const transaction = await sequelize.transaction();
    try {
      console.log('Starting grantAchievement service:', { user_id, achievement_id });
      const user = await User.findByPk(user_id, { transaction });
      const achievement = await Achievement.findByPk(achievement_id, { transaction });

      if (!user || !achievement) {
        throw new Error('User or achievement not found');
      }

      // Cek apakah pengguna sudah memiliki achievement ini
      const hasAchievement = await UserAchievement.findOne({
        where: {
          user_id,
          achievement_id,
          status: true,
        },
        transaction,
      });

      if (hasAchievement) {
        throw new Error('You already have this achievement.');
      }

      // Catat di tabel pivot user_achievements
      const userAchievement = await UserAchievement.create({
        user_id,
        achievement_id,
        status: true,
      }, { transaction });

      console.log('User achievement created:', userAchievement.toJSON());

      // Tambah counter di tabel user
      await user.increment('totalAchievement');

      // Berikan reward
      await this.addCoins(user_id, achievement.coin_reward, { type: 'Achievement', id: achievement.id });

      await transaction.commit();
      console.log('Transaction committed successfully');
      return userAchievement;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Menyelesaikan challenge untuk pengguna jika belum pernah diselesaikan.
   * @param {number} user_id
   * @param {number} challenge_id
   * @returns {Promise<object>}
   */
  static async completeChallenge(user_id, challenge_id) {
    const transaction = await sequelize.transaction();
    try {
      const user = await User.findByPk(user_id, { transaction });
      const challenge = await Challenge.findByPk(challenge_id, { transaction });

      if (!user || !challenge) {
        throw new Error('User or challenge not found');
      }

      // Cek apakah user sudah menyelesaikan challenge ini
      const hasCompleted = await UserChallenge.findOne({
        where: {
          user_id,
          challenge_id,
          status: true,
        },
        transaction,
      });

      if (hasCompleted) {
        throw new Error('You have already completed this challenge.');
      }

      // Catat di tabel pivot user_challenges
      const userChallenge = await UserChallenge.create({
        user_id,
        challenge_id,
        status: true,
      }, { transaction });

      // Tambah counter di tabel user
      await user.increment('totalChallenge');

      // Berikan reward
      await this.addExp(user_id, challenge.exp_reward, { type: 'Challenge', id: challenge.id });

      await transaction.commit();
      return userChallenge;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Memproses penukaran reward oleh pengguna.
   * @param {number} user_id
   * @param {number} reward_id
   * @returns {Promise<object>}
   */
  static async redeemReward(user_id, reward_id) {
    const transaction = await sequelize.transaction();
    try {
      const user = await User.findByPk(user_id, { transaction });
      const reward = await Reward.findByPk(reward_id, { transaction });

      if (!user || !reward) {
        throw new Error('User or reward not found');
      }

      // 1. Validasi
      if (user.totalCoin < reward.coin_requirement) {
        throw new Error('Koin tidak mencukupi.');
      }
      if (reward.stock <= 0) {
        throw new Error('Stok hadiah habis.');
      }
      if (!reward.status) {
        throw new Error('Hadiah ini tidak aktif.');
      }

      // 2. Kurangi koin pengguna & stok reward
      await this.useCoins(user_id, reward.coin_requirement, { type: 'Reward', id: reward.id });
      await reward.decrement('stock');

      // 3. Catat di tabel user_rewards
      const userReward = await UserReward.create({
        user_id,
        reward_id,
        status: true,
        additional_info: { redemption_code: 'XYZ-' + Date.now() }
      }, { transaction });

      await transaction.commit();
      return userReward;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Ambil transaksi coin user dengan pagination dan filter tipe.
   */
  static async getCoinTransactions(user_id, { page = 1, limit = 20, type } = {}) {
    const offset = (page - 1) * limit;
    const whereClause = { user_id };
    if (type) whereClause.type = type;

    const transactions = await CoinTransaction.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    const totalPages = Math.ceil(transactions.count / limit);
    return {
      transactions: transactions.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: transactions.count,
        items_per_page: parseInt(limit),
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    };
  }

  /**
   * Ambil transaksi exp user dengan pagination dan filter tipe.
   */
  static async getExpTransactions(user_id, { page = 1, limit = 20, type } = {}) {
    const offset = (page - 1) * limit;
    const whereClause = { user_id };
    if (type) whereClause.type = type;

    const transactions = await ExpTransaction.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    const totalPages = Math.ceil(transactions.count / limit);
    return {
      transactions: transactions.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: transactions.count,
        items_per_page: parseInt(limit),
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    };
  }

  /**
   * Ambil achievements aktif beserta progress user.
   */
  static async getAchievements(user_id) {
    const achievements = await Achievement.findAll({
      where: { status: true },
      include: [
        {
          model: UserAchievement,
          as: 'userAchievements',
          where: { user_id },
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });

    return achievements;
  }

  /**
   * Ambil challenges berdasarkan status (active: dalam rentang tanggal saat ini).
   */
  static async getChallenges(user_id, { status = 'active' } = {}) {
    let whereClause = { status: true };
    if (status === 'active') {
      const now = new Date();
      whereClause = {
        ...whereClause,
        started_at: { [Op.lte]: now },
        ended_at: { [Op.gte]: now },
      };
    }

    const challenges = await Challenge.findAll({
      where: whereClause,
      include: [
        {
          model: UserChallenge,
          as: 'userChallenges',
          where: { user_id },
          required: false,
        },
      ],
      order: [['started_at', 'DESC']],
    });

    return challenges;
  }

  /**
   * Ambil rewards aktif dengan filter kategori/tipe dan stok > 0.
   */
  static async getRewards({ status } = {}) {
    const whereClause = {
      status: true,
      stock: { [Op.gt]: 0 },
    };
    if (status) whereClause.status = status;

    const rewards = await Reward.findAll({
      where: whereClause,
      order: [['coin_requirement', 'ASC']],
    });

    return rewards;
  }
}

module.exports = GamificationService;