import Notification from '../models/Notification.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ receiver: req.user.id })
      .populate('sender', 'username profilePic isVerified')
      .populate('post', 'media')
      .populate('comment', 'content')
      .populate('story', 'mediaUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/notifications/read
// @access  Private
export const markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { receiver: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications
// @access  Private
export const clearNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ receiver: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Notifications cleared successfully',
    });
  } catch (error) {
    next(error);
  }
};
