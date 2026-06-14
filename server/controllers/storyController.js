import Story from '../models/Story.js';
import Follow from '../models/Follow.js';
import Like from '../models/Like.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { uploadMedia, deleteMedia } from '../config/cloudinary.js';

// @desc    Upload a new story
// @route   POST /api/stories
// @access  Private
export const createStory = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an image or video for your story' });
    }

    const name = (req.file.originalname || '').toLowerCase();
    const mime = (req.file.mimetype || '').toLowerCase();
    const isVideo = mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.webm') || name.endsWith('.mkv') || name.endsWith('.avi') || name.endsWith('.3gp') || name.endsWith('.quicktime');
    const uploadResult = await uploadMedia(req.file, 'gminsta/stories');

    if (!uploadResult) {
      return res.status(500).json({ success: false, error: 'Failed to upload media' });
    }

    const story = await Story.create({
      user: req.user.id,
      mediaUrl: uploadResult.url,
      mediaType: isVideo ? 'video' : 'image',
      public_id: uploadResult.public_id,
      highlightName: req.body.highlightName || '',
    });

    const populated = await Story.findById(story._id).populate('user', 'username profilePic isVerified');

    res.status(201).json({
      success: true,
      story: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get stories feed (active stories from followed users and self)
// @route   GET /api/stories/feed
// @access  Private
export const getStoriesFeed = async (req, res, next) => {
  try {
    // Get followed users
    const follows = await Follow.find({ follower: req.user.id, isAccepted: true });
    const followedIds = follows.map((f) => f.following);

    const queryIds = [req.user.id, ...followedIds];

    // Find all active (non-expired) stories from self and followed users
    const stories = await Story.find({
      user: { $in: queryIds },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: 1 })
      .populate('user', 'username profilePic isVerified');

    // Group stories by user for frontend slideshows
    const groupedStories = {};
    for (const story of stories) {
      const uId = story.user._id.toString();
      const hasViewed = story.views.includes(req.user.id);
      const isLiked = await Like.exists({ user: req.user.id, story: story._id });

      if (!groupedStories[uId]) {
        groupedStories[uId] = {
          user: story.user,
          stories: [],
          allViewed: true, // will turn false if any story is not viewed
        };
      }

      groupedStories[uId].stories.push({
        ...story.toObject(),
        hasViewed,
        isLiked: !!isLiked,
      });

      if (!hasViewed && uId !== req.user.id) {
        groupedStories[uId].allViewed = false;
      }
    }

    // Always keep current user stories at the beginning if they exist
    const result = Object.values(groupedStories);
    const selfGroupIndex = result.findIndex((group) => group.user._id.toString() === req.user.id);
    let sortedResult = [...result];
    
    if (selfGroupIndex > -1) {
      const [selfGroup] = sortedResult.splice(selfGroupIndex, 1);
      sortedResult.unshift(selfGroup);
    }

    res.status(200).json({
      success: true,
      feed: sortedResult,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record story view
// @route   POST /api/stories/:id/view
// @access  Private
export const viewStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found' });
    }

    if (story.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: 'Story has expired' });
    }

    // Add user to views if not already present
    if (!story.views.includes(req.user.id)) {
      story.views.push(req.user.id);
      await story.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
export const deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found' });
    }

    if (story.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this story' });
    }

    if (story.public_id) {
      await deleteMedia(story.public_id, story.mediaUrl.includes('cloudinary'));
    }

    await story.deleteOne();
    await Like.deleteMany({ story: story._id });

    res.status(200).json({ success: true, message: 'Story deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get story viewers (story owner only)
// @route   GET /api/stories/:id/viewers
// @access  Private
export const getStoryViewers = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('views', 'username fullname profilePic isVerified');

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found' });
    }

    if (story.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to view this list' });
    }

    res.status(200).json({ success: true, viewers: story.views });
  } catch (error) {
    next(error);
  }
};

// @desc    Like or Unlike a story
// @route   POST /api/stories/:id/like
// @access  Private
export const toggleLikeStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found' });
    }

    const alreadyLiked = await Like.findOne({ user: req.user.id, story: story._id });

    if (alreadyLiked) {
      // Unlike
      await alreadyLiked.deleteOne();
      
      // Remove notification
      await Notification.findOneAndDelete({
        sender: req.user.id,
        receiver: story.user,
        type: 'story_reaction',
        story: story._id,
      });

      return res.status(200).json({ success: true, isLiked: false });
    } else {
      // Like
      await Like.create({ user: req.user.id, story: story._id });

      // Notify story owner
      if (story.user.toString() !== req.user.id) {
        await Notification.create({
          sender: req.user.id,
          receiver: story.user,
          type: 'story_reaction',
          story: story._id,
          text: 'liked your story.',
        });
      }

      return res.status(200).json({ success: true, isLiked: true });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user story highlights
// @route   GET /api/stories/highlights/:username
// @access  Private
export const getHighlights = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Fetch archived stories that user tagged as highlights (highlightName is not empty)
    const highlights = await Story.find({
      user: user._id,
      highlightName: { $ne: '' },
    }).sort({ createdAt: 1 });

    // Group highlights by highlightName
    const grouped = {};
    highlights.forEach((h) => {
      if (!grouped[h.highlightName]) {
        grouped[h.highlightName] = [];
      }
      grouped[h.highlightName].push(h);
    });

    res.status(200).json({ success: true, highlights: grouped });
  } catch (error) {
    next(error);
  }
};
