import mongoose from 'mongoose';

const LikeSchema = new mongoose.Schema(
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
      default: null,
      index: true,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    reel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reel',
      default: null,
      index: true,
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate likes
LikeSchema.index({ user: 1, post: 1 }, { unique: true, partialFilterExpression: { post: { $type: 'objectId' } } });
LikeSchema.index({ user: 1, comment: 1 }, { unique: true, partialFilterExpression: { comment: { $type: 'objectId' } } });
LikeSchema.index({ user: 1, reel: 1 }, { unique: true, partialFilterExpression: { reel: { $type: 'objectId' } } });
LikeSchema.index({ user: 1, story: 1 }, { unique: true, partialFilterExpression: { story: { $type: 'objectId' } } });

const Like = mongoose.model('Like', LikeSchema);
export default Like;
