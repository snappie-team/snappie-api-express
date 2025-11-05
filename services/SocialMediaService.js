const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const User = require("../models/User");
const Place = require("../models/Place");
const Post = require("../models/Post");
const UserFollow = require("../models/UserFollow");
const UserLike = require("../models/UserLike");
const UserComment = require("../models/UserComment");

/**
 * SocialMediaService
 * Mengelola logika bisnis untuk fitur social media (follow, posts, likes, comments)
 */
class SocialMediaService {
  /**
   * Follow a user
   * @param {number} follower_id - ID pengguna yang melakukan follow
   * @param {number} target_user_id - ID pengguna yang di-follow
   * @returns {Promise<object>}
   */
  static async followUser(follower_id, target_user_id) {
    const transaction = await sequelize.transaction();

    try {
      // Can't follow yourself
      if (follower_id === parseInt(target_user_id)) {
        throw new Error("You cannot follow yourself");
      }

      // Check if target user exists
      const targetUser = await User.findByPk(target_user_id, { transaction });
      if (!targetUser) {
        throw new Error("User not found");
      }

      // Check if already following
      const existingFollow = await UserFollow.findOne({
        where: {
          follower_id,
          following_id: target_user_id,
        },
        transaction,
      });

      if (existingFollow) {
        throw new Error("You are already following this user");
      }

      // Create follow relationship
      await UserFollow.create(
        {
          follower_id,
          following_id: target_user_id,
        },
        { transaction }
      );

      // Update follower's following count
      const follower = await User.findByPk(follower_id, { transaction });
      await follower.update(
        {
          totalFollowing: follower.totalFollowing + 1,
        },
        { transaction }
      );

      // Update target user's followers count
      await targetUser.update(
        {
          totalFollower: targetUser.totalFollower + 1,
        },
        { transaction }
      );

      await transaction.commit();

      return {
        success: true,
        message: "Successfully followed user",
        data: {
          following_user: {
            id: targetUser.id,
            name: targetUser.name,
            username: targetUser.username,
            avatar_url: targetUser.imageUrl,
          },
        },
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Unfollow a user
   * @param {number} follower_id - ID pengguna yang melakukan unfollow
   * @param {number} target_user_id - ID pengguna yang di-unfollow
   * @returns {Promise<object>}
   */
  static async unfollowUser(follower_id, target_user_id) {
    const transaction = await sequelize.transaction();

    try {
      // Find follow relationship
      const followRelation = await UserFollow.findOne({
        where: {
          follower_id,
          following_id: target_user_id,
        },
        transaction,
      });

      if (!followRelation) {
        throw new Error("You are not following this user");
      }

      // Remove follow relationship
      await followRelation.destroy({ transaction });

      // Update follower's following count
      const follower = await User.findByPk(follower_id, { transaction });
      await follower.update(
        {
          totalFollowing: Math.max(0, follower.totalFollowing - 1),
        },
        { transaction }
      );

      // Update target user's followers count
      const targetUser = await User.findByPk(target_user_id, { transaction });
      await targetUser.update(
        {
          totalFollower: Math.max(0, targetUser.totalFollower - 1),
        },
        { transaction }
      );

      await transaction.commit();

      return {
        success: true,
        message: "Successfully unfollowed user",
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get user's followers
   * @param {number} user_id - ID pengguna
   * @param {number} page - Halaman
   * @param {number} limit - Limit per halaman
   * @returns {Promise<object>}
   */
  static async getUserFollowers(user_id, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const followers = await UserFollow.findAndCountAll({
        where: { following_id: user_id },
        include: [
          {
            model: User,
            as: "follower",
            attributes: ["id", "name", "username", "imageUrl"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      const totalPages = Math.ceil(followers.count / limit);

      return {
        success: true,
        message: "Followers retrieved successfully",
        data: {
          followers: followers.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: followers.count,
            items_per_page: parseInt(limit),
            has_next: page < totalPages,
            has_prev: page > 1,
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's following
   * @param {number} user_id - ID pengguna
   * @param {number} page - Halaman
   * @param {number} limit - Limit per halaman
   * @returns {Promise<object>}
   */
  static async getUserFollowing(user_id, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const following = await UserFollow.findAndCountAll({
        where: { follower_id: user_id },
        include: [
          {
            model: User,
            as: "following",
            attributes: ["id", "name", "username", "imageUrl"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      const totalPages = Math.ceil(following.count / limit);

      return {
        success: true,
        message: "Following retrieved successfully",
        data: {
          following: following.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: following.count,
            items_per_page: parseInt(limit),
            has_next: page < totalPages,
            has_prev: page > 1,
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a post
   * @param {number} user_id - ID pengguna
   * @param {object} postData - Data post
   * @param {number} postData.place_id - ID tempat (opsional)
   * @param {string} postData.content - Konten post
   * @param {Array} postData.image_urls - URL gambar
   * @param {object} postData.additional_info - Informasi tambahan
   * @returns {Promise<object>}
   */
  static async createPost(user_id, postData) {
    try {
      const { place_id, content, image_urls, additional_info } = postData;

      // Check if place exists (if place_id provided and not null)
      if (place_id !== null && place_id !== undefined) {
        const place = await Place.findByPk(place_id);
        if (!place) {
          throw new Error("Place not found");
        }
      }

      const post = await Post.create({
        user_id,
        place_id,
        content,
        image_urls: image_urls || [],
        additional_info: additional_info || {},
      });

      // Update user's posts count
      const user = await User.findByPk(user_id);
      await user.update({
        totalPost: user.totalPost + 1,
      });

      // Load the created post with user and place info
      const createdPost = await Post.findByPk(post.id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "username", "imageUrl"],
          },
          {
            model: Place,
            as: "place",
            attributes: ["id", "name", "latitude", "longitude"],
            required: false,
          },
        ],
      });

      return {
        success: true,
        message: "Post created successfully",
        data: createdPost,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get posts feed
   * @param {number} user_id - ID pengguna
   * @param {number} page - Halaman
   * @param {number} limit - Limit per halaman
   * @returns {Promise<object>}
   */
  static async getFeed(user_id, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      // Get user's following list
      // const following = await UserFollow.findAll({
      //   where: { follower_id: user_id },
      //   attributes: ['following_id']
      // });

      // const followingIds = following.map(f => f.following_id);
      // followingIds.push(user_id); // Include user's own posts

      const posts = await Post.findAndCountAll({
        where: {
          // user_id: { [Op.in]: followingIds },
          status: true,
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "username", "imageUrl"],
          },
          {
            model: Place,
            as: "place",
            attributes: ["id", "name", "latitude", "longitude"],
            required: false,
          },
          {
            model: UserLike,
            as: "likes",
            where: { user_id },
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
        distinct: true,
      });

      const totalPages = Math.ceil(posts.count / limit);

      return {
        success: true,
        message: "Feed retrieved successfully",
        data: {
          posts: posts.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: posts.count,
            items_per_page: parseInt(limit),
            has_next: page < totalPages,
            has_prev: page > 1,
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get following feed (posts from users you follow)
   * @param {number} user_id - ID pengguna
   * @param {number} page - Halaman
   * @param {number} limit - Limit per halaman
   * @returns {Promise<object>}
   */
  static async getFollowingFeed(user_id, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      // Get user's following list
      const following = await UserFollow.findAll({
        where: { follower_id: user_id },
        attributes: ['following_id']
      });

      const followingIds = following.map(f => f.following_id);
      followingIds.push(parseInt(user_id)); // Include user's own posts

      const posts = await Post.findAndCountAll({
        where: {
          user_id: { [Op.in]: followingIds },
          status: true,
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "username", "imageUrl"],
          },
          {
            model: Place,
            as: "place",
            attributes: ["id", "name", "latitude", "longitude"],
            required: false,
          },
          {
            model: UserLike,
            as: "likes",
            where: { user_id },
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
        distinct: true,
      });

      const totalPages = Math.ceil(posts.count / limit);

      return {
        success: true,
        message: "Following feed retrieved successfully",
        data: {
          posts: posts.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: posts.count,
            items_per_page: parseInt(limit),
            has_next: page < totalPages,
            has_prev: page > 1,
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get trending feed (posts with most interactions)
   * @param {number} user_id - ID pengguna
   * @param {number} page - Halaman
   * @param {number} limit - Limit per halaman
   * @returns {Promise<object>}
   */
  static async getTrendingFeed(user_id, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const posts = await Post.findAndCountAll({
        where: {
          status: true,
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "username", "imageUrl"],
          },
          {
            model: Place,
            as: "place",
            attributes: ["id", "name", "latitude", "longitude"],
            required: false,
          },
          {
            model: UserLike,
            as: "likes",
            where: { user_id },
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [
          [sequelize.literal('(total_like + total_comment)'), 'DESC'], // Sort by total interactions
          ["created_at", "DESC"] // Secondary sort by date
        ],
        distinct: true,
      });

      const totalPages = Math.ceil(posts.count / limit);

      return {
        success: true,
        message: "Trending feed retrieved successfully",
        data: {
          posts: posts.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: posts.count,
            items_per_page: parseInt(limit),
            has_next: page < totalPages,
            has_prev: page > 1,
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get post by ID
   * @param {number} user_id - ID pengguna
   * @param {number} post_id - ID post
   * @returns {Promise<object>}
   */
  static async getPostById(user_id, post_id) {
    try {
      const post = await Post.findByPk(post_id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "username", "imageUrl"],
          },
          {
            model: Place,
            as: "place",
            attributes: ["id", "name", "latitude", "longitude"],
            required: false,
          },
          {
            model: UserLike,
            as: "likes",
            where: { user_id },
            required: false,
          },
        ],
      });

      if (!post) {
        throw new Error("Post not found");
      }

      return {
        success: true,
        message: "Post retrieved successfully",
        data: post,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Like/Unlike a post
   * @param {number} user_id - ID pengguna
   * @param {number} post_id - ID post
   * @returns {Promise<object>}
   */
  static async togglePostLike(user_id, post_id) {
    const transaction = await sequelize.transaction();

    try {
      // Check if post exists
      const post = await Post.findByPk(post_id, { transaction });
      if (!post) {
        throw new Error("Post not found");
      }

      // Check if user already liked this post
      const existingLike = await UserLike.findOne({
        where: {
          user_id,
          related_to_id: post_id,
          related_to_type: "App\\Models\\Post",
        },
        transaction,
      });

      let isLiked = false;
      let newLikeCount = post.total_like;

      if (existingLike) {
        // Unlike the post
        await existingLike.destroy({ transaction });
        newLikeCount = Math.max(0, post.total_like - 1);
        isLiked = false;
      } else {
        // Like the post
        await UserLike.create(
          {
            user_id,
            related_to_id: post_id,
            related_to_type: "App\\Models\\Post",
          },
          { transaction }
        );
        newLikeCount = post.total_like + 1;
        isLiked = true;
      }

      // Update post like count
      await post.update(
        {
          total_like: newLikeCount,
        },
        { transaction }
      );

      await transaction.commit();

      return {
        success: true,
        message: isLiked
          ? "Post liked successfully"
          : "Post unliked successfully",
        data: {
          is_liked: isLiked,
          total_likes: newLikeCount,
        },
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Add comment to post
   * @param {number} user_id - ID pengguna
   * @param {number} post_id - ID post
   * @param {object} commentData - Data komentar
   * @param {string} commentData.content - Konten komentar
   * @param {number} commentData.parent_id - ID parent komentar (opsional)
   * @returns {Promise<object>}
   */
  static async addPostComment(user_id, post_id, commentData) {
    const transaction = await sequelize.transaction();

    try {
      const { content, parent_id } = commentData;

      // Check if post exists
      const post = await Post.findByPk(post_id, { transaction });
      if (!post) {
        throw new Error("Post not found");
      }

      // Check if parent comment exists (for replies)
      if (parent_id) {
        const parentComment = await UserComment.findByPk(parent_id, {
          transaction,
        });
        if (
          !parentComment ||
          parentComment.related_to_id !== parseInt(post_id)
        ) {
          throw new Error("Parent comment not found");
        }
      }

      // Create comment
      const comment = await UserComment.create(
        {
          user_id,
          related_to_id: post_id,
          related_to_type: "Post",
          content,
          parent_id,
        },
        { transaction }
      );

      // Update post comment count
      await post.update(
        {
          total_comment: post.total_comment + 1,
        },
        { transaction }
      );

      await transaction.commit();

      // Load the created comment with user info
      const createdComment = await UserComment.findByPk(comment.id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "username", "imageUrl"],
          },
        ],
      });

      return {
        success: true,
        message: "Comment added successfully",
        data: createdComment,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get post comments
   * @param {number} post_id - ID post
   * @param {number} page - Halaman
   * @param {number} limit - Limit per halaman
   * @returns {Promise<object>}
   */
  static async getPostComments(post_id, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const comments = await UserComment.findAndCountAll({
        where: {
          related_to_id: post_id,
          related_to_type: "Post",
          parent_id: null, // Only get top-level comments
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "username", "imageUrl"],
          },
          {
            model: UserComment,
            as: "replies",
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "name", "username", "imageUrl"],
              },
            ],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      const totalPages = Math.ceil(comments.count / limit);

      return {
        success: true,
        message: "Comments retrieved successfully",
        data: {
          comments: comments.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: comments.count,
            items_per_page: parseInt(limit),
            has_next: page < totalPages,
            has_prev: page > 1,
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all likes for a post
   * @param {number} post_id - ID post
   * @param {number} page - Halaman
   * @param {number} limit - Limit per halaman
   * @returns {Promise<object>}
   */
  static async getPostLikes(post_id, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      // Check if post exists
      const post = await Post.findByPk(post_id);
      if (!post) {
        throw new Error("Post not found");
      }

      const likes = await UserLike.findAndCountAll({
        where: {
          related_to_id: post_id,
          related_to_type: "App\\Models\\Post",
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "username", "imageUrl"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      const totalPages = Math.ceil(likes.count / limit);

      return {
        success: true,
        message: "Post likes retrieved successfully",
        data: {
          likes: likes.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: likes.count,
            items_per_page: parseInt(limit),
            has_next: page < totalPages,
            has_prev: page > 1,
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SocialMediaService;
