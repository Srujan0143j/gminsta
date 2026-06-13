import Post from '../models/Post.js';
import Like from '../models/Like.js';
import SavedPost from '../models/SavedPost.js';
import Follow from '../models/Follow.js';
import Notification from '../models/Notification.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { uploadMedia, deleteMedia } from '../config/cloudinary.js';

// Helper to extract hashtags from caption
const extractHashtags = (caption) => {
  if (!caption) return [];
  const regex = /#(\w+)/g;
  const matches = caption.match(regex);
  return matches ? matches.map((match) => match.replace('#', '').toLowerCase()) : [];
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res, next) => {
  try {
    const { caption, location, isDraft, isArchived } = req.body;

    let mediaItems = [];

    // Check if files are uploaded (supports single file as req.file or multiple files as req.files)
    const files = req.files || (req.file ? [req.file] : []);

    if (files.length === 0 && !isDraft) {
      return res.status(400).json({ success: false, error: 'Please upload at least one image or video' });
    }

    for (const file of files) {
      const isVideo = file.mimetype.startsWith('video');
      const uploadResult = await uploadMedia(file, isVideo ? 'gminsta/videos' : 'gminsta/posts');
      if (uploadResult) {
        mediaItems.push({
          url: uploadResult.url,
          type: isVideo ? 'video' : 'image',
          public_id: uploadResult.public_id,
        });
      }
    }

    const hashtags = extractHashtags(caption);

    const post = await Post.create({
      user: req.user.id,
      media: mediaItems,
      caption,
      location,
      hashtags,
      isDraft: isDraft === 'true' || isDraft === true,
      isArchived: isArchived === 'true' || isArchived === true,
    });

    const populatedPost = await Post.findById(post._id).populate('user', 'username profilePic isVerified');

    res.status(201).json({
      success: true,
      post: populatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get home feed posts (followed users + suggestion fill)
// @route   GET /api/posts/feed
// @access  Private
export const getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Get followed users
    const followingRecords = await Follow.find({
      follower: req.user.id,
      isAccepted: true,
    });
    const followedIds = followingRecords.map((r) => r.following);

    // Feed includes self posts + followed users posts
    const queryIds = [req.user.id, ...followedIds];

    // Exclude posts from blocked users
    const user = await User.findById(req.user.id);
    const blockedIds = user.blockedUsers || [];

    const feedQuery = {
      user: { $in: queryIds, $nin: blockedIds },
      isDraft: false,
      isArchived: false,
      "media.0": { $exists: true }, // Filter out empty media posts
    };

    let posts = await Post.find(feedQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePic isVerified');

    // If feed is empty or thin, fill with suggested trending posts from others
    if (posts.length < limit && page === 1) {
      const remainingLimit = limit - posts.length;
      const additionalPosts = await Post.find({
        user: { $nin: [...queryIds, ...blockedIds] },
        isDraft: false,
        isArchived: false,
        "media.0": { $exists: true }, // Filter out empty media posts
      })
        .sort({ likesCount: -1, createdAt: -1 })
        .limit(remainingLimit)
        .populate('user', 'username profilePic isVerified');

      posts = [...posts, ...additionalPosts];
    }

    // Check if the posts are liked and saved by current user
    const postsWithInteraction = await Promise.all(
      posts.map(async (post) => {
        const isLiked = await Like.exists({ user: req.user.id, post: post._id });
        const isSaved = await SavedPost.exists({ user: req.user.id, post: post._id });
        return {
          ...post.toObject(),
          isLiked: !!isLiked,
          isSaved: !!isSaved,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: postsWithInteraction.length,
      posts: postsWithInteraction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get explore posts (trending, popular, random)
// @route   GET /api/posts/explore
// @access  Private
export const getExplore = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const blockedIds = req.user.blockedUsers || [];

    // Exclude own and blocked user posts, only public
    const query = {
      user: { $nin: [req.user.id, ...blockedIds] },
      isDraft: false,
      isArchived: false,
      "media.0": { $exists: true }, // Filter out empty media posts
    };

    const posts = await Post.find(query)
      .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePic isVerified');

    const postsWithInteraction = await Promise.all(
      posts.map(async (post) => {
        const isLiked = await Like.exists({ user: req.user.id, post: post._id });
        const isSaved = await SavedPost.exists({ user: req.user.id, post: post._id });
        return {
          ...post.toObject(),
          isLiked: !!isLiked,
          isSaved: !!isSaved,
        };
      })
    );

    res.status(200).json({
      success: true,
      posts: postsWithInteraction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Private
export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username profilePic isVerified');

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Check block
    if (req.user.blockedUsers.includes(post.user._id) || post.user.blockedUsers?.includes(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Post unavailable' });
    }

    const isLiked = await Like.exists({ user: req.user.id, post: post._id });
    const isSaved = await SavedPost.exists({ user: req.user.id, post: post._id });

    res.status(200).json({
      success: true,
      post: {
        ...post.toObject(),
        isLiked: !!isLiked,
        isSaved: !!isSaved,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Check post ownership
    if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to update this post' });
    }

    const { caption, location, isArchived, isDraft } = req.body;

    if (caption !== undefined) {
      post.caption = caption;
      post.hashtags = extractHashtags(caption);
    }
    if (location !== undefined) post.location = location;
    if (isArchived !== undefined) post.isArchived = isArchived;
    if (isDraft !== undefined) post.isDraft = isDraft;

    await post.save();

    const updatedPost = await Post.findById(post._id).populate('user', 'username profilePic isVerified');

    res.status(200).json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Owner or admin can delete
    if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this post' });
    }

    // Delete media assets
    for (const item of post.media) {
      if (item.public_id) {
        await deleteMedia(item.public_id, item.url.includes('cloudinary'));
      }
    }

    await post.deleteOne();

    // Clean up dependent resources
    await Like.deleteMany({ post: post._id });
    await Comment.deleteMany({ post: post._id });
    await SavedPost.deleteMany({ post: post._id });
    await Notification.deleteMany({ post: post._id });

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like or Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
export const toggleLikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const alreadyLiked = await Like.findOne({ user: req.user.id, post: post._id });

    if (alreadyLiked) {
      // Unlike
      await alreadyLiked.deleteOne();
      post.likesCount = Math.max(0, post.likesCount - 1);
      await post.save();

      // Clean up notification
      await Notification.findOneAndDelete({
        sender: req.user.id,
        receiver: post.user,
        type: 'like',
        post: post._id,
      });

      return res.status(200).json({ success: true, isLiked: false, likesCount: post.likesCount });
    } else {
      // Like
      await Like.create({ user: req.user.id, post: post._id });
      post.likesCount += 1;
      await post.save();

      // Create notification (if liking someone else's post)
      if (post.user.toString() !== req.user.id) {
        await Notification.create({
          sender: req.user.id,
          receiver: post.user,
          type: 'like',
          post: post._id,
          text: 'liked your post.',
        });
      }

      return res.status(200).json({ success: true, isLiked: true, likesCount: post.likesCount });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Save or Unsave a post
// @route   POST /api/posts/:id/save
// @access  Private
export const toggleSavePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const alreadySaved = await SavedPost.findOne({ user: req.user.id, post: post._id });

    if (alreadySaved) {
      // Unsave
      await alreadySaved.deleteOne();
      return res.status(200).json({ success: true, isSaved: false });
    } else {
      // Save
      await SavedPost.create({ user: req.user.id, post: post._id });
      return res.status(200).json({ success: true, isSaved: true });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user saved posts
// @route   GET /api/posts/saved
// @access  Private
export const getSavedPosts = async (req, res, next) => {
  try {
    const saved = await SavedPost.find({ user: req.user.id })
      .populate({
        path: 'post',
        populate: { path: 'user', select: 'username profilePic isVerified' },
      })
      .sort({ createdAt: -1 });

    const validPosts = saved.map((s) => s.post).filter(Boolean);

    res.status(200).json({
      success: true,
      posts: validPosts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get users who liked a post
// @route   GET /api/posts/:id/likes
// @access  Private
export const getUsersWhoLiked = async (req, res, next) => {
  try {
    const likes = await Like.find({ post: req.params.id })
      .populate('user', 'username fullname profilePic isVerified')
      .sort({ createdAt: -1 });

    const users = likes.map((l) => l.user).filter(Boolean);

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts by username
// @route   GET /api/posts/user/:username
// @access  Private
export const getUserPosts = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const posts = await Post.find({
      user: user._id,
      isDraft: false,
      isArchived: false,
    })
      .sort({ createdAt: -1 })
      .populate('user', 'username profilePic isVerified');

    const postsWithInteraction = await Promise.all(
      posts.map(async (post) => {
        const isLiked = await Like.exists({ user: req.user.id, post: post._id });
        const isSaved = await SavedPost.exists({ user: req.user.id, post: post._id });
        return {
          ...post.toObject(),
          isLiked: !!isLiked,
          isSaved: !!isSaved,
        };
      })
    );

    res.status(200).json({ success: true, posts: postsWithInteraction });
  } catch (error) {
    next(error);
  }
};
