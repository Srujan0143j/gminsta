import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { uploadMedia } from '../config/cloudinary.js';

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const { text, conversationId, recipientId, isGroup } = req.body;
    let activeConversationId = conversationId;

    // Handle media attachment if any
    let mediaUrl = '';
    let mediaType = 'none';
    let public_id = '';

    if (req.file) {
      const name = (req.file.originalname || '').toLowerCase();
      const mime = (req.file.mimetype || '').toLowerCase();
      const isVoice = mime.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.ogg') || name.endsWith('.m4a');
      const isVideo = mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.webm') || name.endsWith('.mkv') || name.endsWith('.avi') || name.endsWith('.3gp') || name.endsWith('.quicktime');
      const uploadResult = await uploadMedia(
        req.file,
        isVoice ? 'gminsta/voice' : isVideo ? 'gminsta/chat_videos' : 'gminsta/chat_images'
      );
      if (uploadResult) {
        mediaUrl = uploadResult.url;
        mediaType = isVoice ? 'voice' : isVideo ? 'video' : 'image';
        public_id = uploadResult.public_id;
      }
    }

    if (!text && !mediaUrl) {
      return res.status(400).json({ success: false, error: 'Cannot send an empty message' });
    }

    // 1-to-1 chat setup if no conversationId is supplied
    if (!activeConversationId && recipientId) {
      // Check if 1-1 conversation already exists
      let conversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [req.user.id, recipientId], $size: 2 },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [req.user.id, recipientId],
        });
      }
      activeConversationId = conversation._id;
    }

    if (!activeConversationId) {
      return res.status(400).json({ success: false, error: 'Conversation target unspecified' });
    }

    // Create message
    const message = await Message.create({
      conversation: activeConversationId,
      sender: req.user.id,
      text: text || '',
      mediaUrl,
      mediaType,
      public_id,
      readBy: [req.user.id],
    });

    // Update conversation last message reference
    const conversation = await Conversation.findByIdAndUpdate(
      activeConversationId,
      { lastMessage: message._id },
      { new: true }
    );

    const populated = await Message.findById(message._id)
      .populate('sender', 'username profilePic isVerified')
      .exec();

    // Emit socket event to conversation participants
    const fullConversation = await Conversation.findById(activeConversationId)
      .populate('participants', 'username fullname profilePic isVerified');

    if (fullConversation && req.io) {
      fullConversation.participants.forEach((participant) => {
        if (participant._id.toString() !== req.user.id) {
          // Format conversation matching getConversations structure for the recipient
          const isGroup = fullConversation.isGroup;
          const displayParticipants = fullConversation.participants.filter(
            (p) => p._id.toString() !== participant._id.toString()
          );

          req.io.to(participant._id.toString()).emit('newMessage', {
            message: populated,
            conversation: {
              ...fullConversation.toObject(),
              displayName: isGroup ? fullConversation.name : displayParticipants[0]?.fullname || 'GMinsta User',
              displayPic: isGroup ? '/uploads/group-avatar.png' : displayParticipants[0]?.profilePic,
              chatPartner: isGroup ? null : displayParticipants[0],
            },
          });
        }
      });
    }

    res.status(201).json({
      success: true,
      message: populated,
      conversation: fullConversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's conversations
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate('participants', 'username fullname profilePic isVerified')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username' },
      })
      .sort({ updatedAt: -1 });

    // Filter participants list so that frontend gets clear information
    const formatted = conversations.map((conv) => {
      const isGroup = conv.isGroup;
      // Filter out self from participant list in 1-1 conversations for easy display
      const displayParticipants = conv.participants.filter(
        (p) => p._id.toString() !== req.user.id
      );

      return {
        ...conv.toObject(),
        displayName: isGroup ? conv.name : displayParticipants[0]?.fullname || 'GMinsta User',
        displayPic: isGroup ? '/uploads/group-avatar.png' : displayParticipants[0]?.profilePic,
        chatPartner: isGroup ? null : displayParticipants[0],
      };
    });

    res.status(200).json({
      success: true,
      conversations: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username profilePic isVerified')
      .sort({ createdAt: 1 });

    // Mark messages as read by current user
    await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: req.user.id } },
      { $push: { readBy: req.user.id } }
    );

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create group conversation
// @route   POST /api/messages/group
// @access  Private
export const createGroupConversation = async (req, res, next) => {
  try {
    const { participantIds, name } = req.body;

    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Please specify participants' });
    }

    if (!name) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }

    // Add self to group participants
    const allParticipants = [...new Set([req.user.id, ...participantIds])];

    const group = await Conversation.create({
      participants: allParticipants,
      isGroup: true,
      name,
      groupAdmin: req.user.id,
    });

    // Create system message
    const message = await Message.create({
      conversation: group._id,
      sender: req.user.id,
      text: `${req.user.fullname} created the group "${name}".`,
      readBy: [req.user.id],
    });

    group.lastMessage = message._id;
    await group.save();

    const populated = await Conversation.findById(group._id)
      .populate('participants', 'username fullname profilePic isVerified')
      .populate('lastMessage');

    res.status(201).json({
      success: true,
      conversation: {
        ...populated.toObject(),
        displayName: populated.name,
        displayPic: '/uploads/group-avatar.png',
        chatPartner: null,
      },
    });
  } catch (error) {
    next(error);
  }
};
