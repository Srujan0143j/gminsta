import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      default: '',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['none', 'image', 'video', 'voice'],
      default: 'none',
    },
    public_id: {
      type: String,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        emoji: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ createdAt: 1 });

const Message = mongoose.model('Message', MessageSchema);
export default Message;
