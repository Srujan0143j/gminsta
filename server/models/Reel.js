import mongoose from 'mongoose';

const ReelSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
    },
    caption: {
      type: String,
      default: '',
      maxlength: [2000, 'Reel caption cannot exceed 2000 characters'],
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

ReelSchema.index({ createdAt: -1 });

const Reel = mongoose.model('Reel', ReelSchema);
export default Reel;
