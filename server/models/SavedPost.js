import mongoose from 'mongoose';

const SavedPostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique bookmark per user-post pairing
SavedPostSchema.index({ user: 1, post: 1 }, { unique: true });

const SavedPost = mongoose.model('SavedPost', SavedPostSchema);
export default SavedPost;
