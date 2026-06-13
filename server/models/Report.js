import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reportedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
      index: true,
    },
    reportedComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    reportedReel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reel',
      default: null,
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Please specify a reason for this report'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ReportSchema.index({ createdAt: -1 });

const Report = mongoose.model('Report', ReportSchema);
export default Report;
