import mongoose from 'mongoose';

const FollowSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isAccepted: {
      type: Boolean,
      default: true, // If the target user's account is private, this defaults to false until accepted
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate follow records
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

const Follow = mongoose.model('Follow', FollowSchema);
export default Follow;
