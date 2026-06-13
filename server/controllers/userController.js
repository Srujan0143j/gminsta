import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import { uploadMedia } from '../config/cloudinary.js';

// @desc    Get user profile by username
// @route   GET /api/users/profile/:username
// @access  Private/Public (Authenticated)
export const getUserProfile = async (req, res, next) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userId = targetUser._id;

    // Check if requester is blocked by this user or has blocked this user
    const hasBlocked = req.user.blockedUsers.includes(userId);
    const isBlockedBy = targetUser.blockedUsers.includes(req.user.id);

    if (isBlockedBy) {
      return res.status(403).json({ success: false, error: 'Profile not available' });
    }

    // Counts
    const postsCount = await Post.countDocuments({ user: userId, isDraft: false, isArchived: false });
    const followersCount = await Follow.countDocuments({ following: userId, isAccepted: true });
    const followingCount = await Follow.countDocuments({ follower: userId, isAccepted: true });

    // Relationship check
    const followRecord = await Follow.findOne({
      follower: req.user.id,
      following: userId,
    });

    let followStatus = 'none'; // 'none', 'following', 'requested'
    if (followRecord) {
      followStatus = followRecord.isAccepted ? 'following' : 'requested';
    }

    const isFollowingUs = await Follow.exists({
      follower: userId,
      following: req.user.id,
      isAccepted: true,
    });

    res.status(200).json({
      success: true,
      profile: {
        _id: targetUser._id,
        username: targetUser.username,
        fullname: targetUser.fullname,
        profilePic: targetUser.profilePic,
        bio: targetUser.bio,
        website: targetUser.website,
        gender: targetUser.gender,
        isPrivate: targetUser.isPrivate,
        isVerified: targetUser.isVerified,
        role: targetUser.role,
        postsCount,
        followersCount,
        followingCount,
        followStatus,
        isFollowingUs: !!isFollowingUs,
        isBlocked: hasBlocked,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { fullname, bio, website, gender, isPrivate } = req.body;

    if (fullname) user.fullname = fullname;
    if (bio !== undefined) user.bio = bio;
    if (website !== undefined) user.website = website;
    if (gender) user.gender = gender;
    if (isPrivate !== undefined) user.isPrivate = isPrivate;

    // Profile pic upload
    if (req.file) {
      const uploadResult = await uploadMedia(req.file, 'gminsta/avatars');
      if (uploadResult) {
        user.profilePic = uploadResult.url;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        fullname: user.fullname,
        profilePic: user.profilePic,
        bio: user.bio,
        website: user.website,
        gender: user.gender,
        isPrivate: user.isPrivate,
        isVerified: user.isVerified,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow a user
// @route   POST /api/users/follow/:id
// @access  Private
export const followUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check block status
    if (targetUser.blockedUsers.includes(req.user.id) || req.user.blockedUsers.includes(targetUserId)) {
      return res.status(403).json({ success: false, error: 'Action blocked' });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: req.user.id,
      following: targetUserId,
    });

    if (existingFollow) {
      return res.status(400).json({ success: false, error: 'Already following or requested to follow this user' });
    }

    const shouldAcceptImmediately = !targetUser.isPrivate;

    const follow = await Follow.create({
      follower: req.user.id,
      following: targetUserId,
      isAccepted: shouldAcceptImmediately,
    });

    // Send real-time notification
    if (shouldAcceptImmediately) {
      await Notification.create({
        sender: req.user.id,
        receiver: targetUserId,
        type: 'follow',
      });
    } else {
      await Notification.create({
        sender: req.user.id,
        receiver: targetUserId,
        type: 'follow_request',
      });
    }

    res.status(200).json({
      success: true,
      followStatus: shouldAcceptImmediately ? 'following' : 'requested',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow a user
// @route   POST /api/users/unfollow/:id
// @access  Private
export const unfollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    const follow = await Follow.findOneAndDelete({
      follower: req.user.id,
      following: targetUserId,
    });

    if (!follow) {
      return res.status(400).json({ success: false, error: 'You are not following this user' });
    }

    // Remove any related follow notifications
    await Notification.deleteMany({
      sender: req.user.id,
      receiver: targetUserId,
      type: { $in: ['follow', 'follow_request'] },
    });

    res.status(200).json({
      success: true,
      followStatus: 'none',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Block / Unblock user
// @route   POST /api/users/block/:id
// @access  Private
export const toggleBlockUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot block yourself' });
    }

    const user = await User.findById(req.user.id);
    const isBlocked = user.blockedUsers.includes(targetUserId);

    if (isBlocked) {
      // Unblock
      user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== targetUserId);
      await user.save();
      return res.status(200).json({ success: true, isBlocked: false });
    } else {
      // Block: add to list and automatically unfollow both ways
      user.blockedUsers.push(targetUserId);
      await user.save();

      await Follow.deleteMany({
        $or: [
          { follower: req.user.id, following: targetUserId },
          { follower: targetUserId, following: req.user.id },
        ],
      });

      return res.status(200).json({ success: true, isBlocked: true });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
export const searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(200).json({ success: true, users: [] });
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { fullname: { $regex: query, $options: 'i' } },
          ],
        },
        { _id: { $ne: req.user.id } },
        { _id: { $nin: req.user.blockedUsers } },
      ],
    })
      .limit(20)
      .select('username fullname profilePic isVerified');

    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get suggested users
// @route   GET /api/users/suggested
// @access  Private
export const getSuggestedUsers = async (req, res, next) => {
  try {
    // Users currently following
    const followingRecords = await Follow.find({
      follower: req.user.id,
    });
    const followingIds = followingRecords.map((r) => r.following.toString());

    // Users who follow us
    const followerRecords = await Follow.find({
      following: req.user.id,
      isAccepted: true,
    });
    const followerIds = followerRecords.map((r) => r.follower.toString());

    // Exclude list: self, already following, blocked
    const excludeIds = [req.user.id, ...followingIds, ...req.user.blockedUsers];

    // Find suggested users: either followers who we don't follow back, or random users
    let suggested = await User.find({
      _id: { $nin: excludeIds },
      isBanned: false,
    })
      .limit(10)
      .select('username fullname profilePic isVerified');

    // Sort to prioritize mutual followers
    suggested = suggested.sort((a, b) => {
      const aFollowsUs = followerIds.includes(a._id.toString()) ? 1 : 0;
      const bFollowsUs = followerIds.includes(b._id.toString()) ? 1 : 0;
      return bFollowsUs - aFollowsUs;
    });

    res.status(200).json({ success: true, users: suggested });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user followers
// @route   GET /api/users/:id/followers
// @access  Private
export const getUserFollowers = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const follows = await Follow.find({ following: userId, isAccepted: true })
      .populate('follower', 'username fullname profilePic isVerified')
      .exec();

    const followers = follows.map((f) => f.follower).filter(Boolean);
    res.status(200).json({ success: true, followers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user following
// @route   GET /api/users/:id/following
// @access  Private
export const getUserFollowing = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const follows = await Follow.find({ follower: userId, isAccepted: true })
      .populate('following', 'username fullname profilePic isVerified')
      .exec();

    const following = follows.map((f) => f.following).filter(Boolean);
    res.status(200).json({ success: true, following });
  } catch (error) {
    next(error);
  }
};
