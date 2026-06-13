import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Reel from '../models/Reel.js';
import Story from '../models/Story.js';
import Report from '../models/Report.js';
import Follow from '../models/Follow.js';
import Like from '../models/Like.js';
import SavedPost from '../models/SavedPost.js';
import Notification from '../models/Notification.js';
import { deleteMedia } from '../config/cloudinary.js';

// ==========================================
// USER ACTIONS (PUBLIC ENCRYPTED / PRIVATE USER ACCESS)
// ==========================================

// @desc    File a new report
// @route   POST /api/reports
// @access  Private
export const createReport = async (req, res, next) => {
  try {
    const { reportedUserId, reportedPostId, reportedCommentId, reportedReelId, reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, error: 'Reason for report is required' });
    }

    const report = await Report.create({
      reporter: req.user.id,
      reportedUser: reportedUserId || null,
      reportedPost: reportedPostId || null,
      reportedComment: reportedCommentId || null,
      reportedReel: reportedReelId || null,
      reason,
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Thank you for keeping GMinsta safe.',
      report,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN ACTIONS (ADMIN PRIVILEGES REQUIRED)
// ==========================================

// @desc    Get dashboard analytics/statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments({ isDraft: false, isArchived: false });
    const totalReels = await Reel.countDocuments();
    const totalStories = await Story.countDocuments();
    const openReports = await Report.countDocuments({ status: 'pending' });

    // Growth rates - simulated or based on date range
    const userGrowth = 12.5; // percent
    const postGrowth = 8.3; // percent

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalPosts,
        totalReels,
        totalStories,
        openReports,
        userGrowth,
        postGrowth,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
export const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'username profilePic')
      .populate('reportedUser', 'username profilePic isBanned')
      .populate({
        path: 'reportedPost',
        populate: { path: 'user', select: 'username' }
      })
      .populate('reportedComment', 'content')
      .populate('reportedReel', 'videoUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update status of a report
// @route   PUT /api/admin/reports/:id
// @access  Private/Admin
export const updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Ban status for a user
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
export const toggleBanUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, error: 'Cannot ban an administrator' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    // If banned, terminate follows
    if (user.isBanned) {
      await Follow.deleteMany({
        $or: [{ follower: user._id }, { following: user._id }],
      });
    }

    res.status(200).json({
      success: true,
      message: `User has been ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
      isBanned: user.isBanned,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin content deletion
// @route   DELETE /api/admin/content
// @access  Private/Admin
export const deleteContentAdmin = async (req, res, next) => {
  try {
    const { contentType, contentId } = req.body;

    if (!contentType || !contentId) {
      return res.status(400).json({ success: false, error: 'Content type and ID are required' });
    }

    if (contentType === 'post') {
      const post = await Post.findById(contentId);
      if (post) {
        for (const item of post.media) {
          if (item.public_id) {
            await deleteMedia(item.public_id, item.url.includes('cloudinary'));
          }
        }
        await post.deleteOne();
        await Like.deleteMany({ post: contentId });
        await Comment.deleteMany({ post: contentId });
        await SavedPost.deleteMany({ post: contentId });
        await Notification.deleteMany({ post: contentId });
      }
    } else if (contentType === 'comment') {
      const comment = await Comment.findById(contentId);
      if (comment) {
        const post = await Post.findById(comment.post);
        if (post) {
          post.commentsCount = Math.max(0, post.commentsCount - 1);
          await post.save();
        }
        await comment.deleteOne();
        await Like.deleteMany({ comment: contentId });
      }
    } else if (contentType === 'reel') {
      const reel = await Reel.findById(contentId);
      if (reel) {
        if (reel.public_id) {
          await deleteMedia(reel.public_id, reel.videoUrl.includes('cloudinary'));
        }
        await reel.deleteOne();
        await Like.deleteMany({ reel: contentId });
      }
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported content type' });
    }

    // Mark reports targeting this item as resolved
    await Report.updateMany(
      {
        $or: [
          { reportedPost: contentId },
          { reportedComment: contentId },
          { reportedReel: contentId },
        ],
      },
      { status: 'resolved' }
    );

    res.status(200).json({
      success: true,
      message: 'Content deleted and associated reports resolved',
    });
  } catch (error) {
    next(error);
  }
};
