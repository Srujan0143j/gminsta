import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    media: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['image', 'video'],
          default: 'image',
        },
        public_id: {
          type: String,
        },
      },
    ],
    caption: {
      type: String,
      default: '',
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    },
    hashtags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    location: {
      type: String,
      default: '',
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDraft: {
      type: Boolean,
      default: false,
      index: true,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for feed querying and tag searches
PostSchema.index({ createdAt: -1 });
PostSchema.index({ hashtags: 1 });

const Post = mongoose.model('Post', PostSchema);
export default Post;
