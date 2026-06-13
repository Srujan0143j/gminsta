import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['like', 'comment', 'follow', 'follow_request', 'mention', 'message', 'story_reaction'],
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    reel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reel',
      default: null,
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      default: null,
    },
    text: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ createdAt: -1 });

// Automatically broadcast notification via Socket.io on creation
NotificationSchema.post('save', async function (doc) {
  if (global.io) {
    try {
      const populated = await doc.populate([
        { path: 'sender', select: 'username profilePic isVerified' },
        { path: 'post', select: 'media' },
        { path: 'comment', select: 'content' },
        { path: 'story', select: 'mediaUrl' },
      ]);
      global.io.to(doc.receiver.toString()).emit('newNotification', populated);
    } catch (err) {
      console.error('Socket notification emission failed:', err);
    }
  }
});

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
