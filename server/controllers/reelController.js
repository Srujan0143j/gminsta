import Reel from '../models/Reel.js';
import Like from '../models/Like.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { uploadMedia, deleteMedia } from '../config/cloudinary.js';

// @desc    Create a new reel (short video)
// @route   POST /api/reels
// @access  Private
export const createReel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a video for your reel' });
    }

    const uploadResult = await uploadMedia(req.file, 'gminsta/reels');
    if (!uploadResult) {
      return res.status(500).json({ success: false, error: 'Failed to upload reel video' });
    }

    const reel = await Reel.create({
      user: req.user.id,
      videoUrl: uploadResult.url,
      public_id: uploadResult.public_id,
      caption: req.body.caption || '',
    });

    const populated = await Reel.findById(reel._id).populate('user', 'username profilePic isVerified');

    res.status(201).json({
      success: true,
      reel: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reels feed
// @route   GET /api/reels
// @access  Private
export const getReels = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const skip = (page - 1) * limit;

    const blockedIds = req.user.blockedUsers || [];

    const reels = await Reel.find({
      user: { $nin: blockedIds },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePic isVerified');

    const reelsWithInteraction = await Promise.all(
      reels.map(async (reel) => {
        const isLiked = await Like.exists({ user: req.user.id, reel: reel._id });
        return {
          ...reel.toObject(),
          isLiked: !!isLiked,
        };
      })
    );

    res.status(200).json({
      success: true,
      reels: reelsWithInteraction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like or Unlike a reel
// @route   POST /api/reels/:id/like
// @access  Private
export const toggleLikeReel = async (req, res, next) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ success: false, error: 'Reel not found' });
    }

    const alreadyLiked = await Like.findOne({ user: req.user.id, reel: reel._id });

    if (alreadyLiked) {
      // Unlike
      await alreadyLiked.deleteOne();
      reel.likesCount = Math.max(0, (reel.likesCount || 0) - 1);
      await reel.save();

      // Clean up notification
      await Notification.findOneAndDelete({
        sender: req.user.id,
        receiver: reel.user,
        type: 'like',
        reel: reel._id,
      });

      return res.status(200).json({ success: true, isLiked: false, likesCount: reel.likesCount });
    } else {
      // Like
      await Like.create({ user: req.user.id, reel: reel._id });
      reel.likesCount = (reel.likesCount || 0) + 1;
      await reel.save();

      // Notify owner
      if (reel.user.toString() !== req.user.id) {
        await Notification.create({
          sender: req.user.id,
          receiver: reel.user,
          type: 'like',
          reel: reel._id,
          text: 'liked your reel.',
        });
      }

      return res.status(200).json({ success: true, isLiked: true, likesCount: reel.likesCount });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Increment reel view count
// @route   POST /api/reels/:id/view
// @access  Private
export const incrementViewCount = async (req, res, next) => {
  try {
    const reel = await Reel.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewsCount: 1 } },
      { new: true }
    );

    if (!reel) {
      return res.status(404).json({ success: false, error: 'Reel not found' });
    }

    res.status(200).json({ success: true, viewsCount: reel.viewsCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a reel
// @route   DELETE /api/reels/:id
// @access  Private
export const deleteReel = async (req, res, next) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ success: false, error: 'Reel not found' });
    }

    if (reel.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this reel' });
    }

    if (reel.public_id) {
      await deleteMedia(reel.public_id, reel.videoUrl.includes('cloudinary'));
    }

    await reel.deleteOne();
    await Like.deleteMany({ reel: reel._id });

    res.status(200).json({ success: true, message: 'Reel deleted successfully' });
  } catch (error) {
    next(error);
  }
};
