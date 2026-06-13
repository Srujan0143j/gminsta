import mongoose from 'mongoose';

const StorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    public_id: {
      type: String,
    },
    views: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // High-level highlight inclusion indicator
    highlightName: {
      type: String,
      default: '', // If set, this story is part of a highlight group
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically delete expired stories
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = mongoose.model('Story', StorySchema);
export default Story;
