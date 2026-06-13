import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Like from '../models/Like.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Helper to notify mentioned users
const handleMentions = async (content, senderId, postReference, commentReference = null) => {
  if (!content) return;
  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex);
  if (!matches) return;

  const usernames = matches.map((match) => match.replace('@', '').toLowerCase());
  const users = await User.find({ username: { $in: usernames } });

  for (const user of users) {
    if (user._id.toString() !== senderId) {
      await Notification.create({
        sender: senderId,
        receiver: user._id,
        type: 'mention',
        post: postReference,
        comment: commentReference,
        text: 'mentioned you in a comment.',
      });
    }
  }
};

// @desc    Add a comment to a post
// @route   POST /api/comments/:postId
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    const { content, parentComment } = req.body;
    const { postId } = req.params;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Comment content is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // If parentComment is provided, check if it exists
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent) {
        return res.status(404).json({ success: false, error: 'Parent comment not found' });
      }
    }

    const comment = await Comment.create({
      post: postId,
      user: req.user.id,
      content,
      parentComment: parentComment || null,
    });

    // Increment comments count on post
    post.commentsCount = (post.commentsCount || 0) + 1;
    await post.save();

    // Notify post owner (if not commenting on own post)
    if (post.user.toString() !== req.user.id) {
      await Notification.create({
        sender: req.user.id,
        receiver: post.user,
        type: 'comment',
        post: post._id,
        comment: comment._id,
        text: parentComment ? 'replied to a comment on your post.' : 'commented on your post.',
      });
    }

    // If it is a reply, notify parent comment owner as well
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (parent && parent.user.toString() !== req.user.id && parent.user.toString() !== post.user.toString()) {
        await Notification.create({
          sender: req.user.id,
          receiver: parent.user,
          type: 'comment',
          post: post._id,
          comment: comment._id,
          text: 'replied to your comment.',
        });
      }
    }

    // Handle @mentions
    await handleMentions(content, req.user.id, post._id, comment._id);

    const populated = await Comment.findById(comment._id).populate('user', 'username profilePic isVerified');

    res.status(201).json({
      success: true,
      comment: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a post
// @route   GET /api/comments/:postId
// @access  Private
export const getCommentsByPost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    // Fetch all comments for the post
    const comments = await Comment.find({ post: postId })
      .populate('user', 'username profilePic isVerified')
      .sort({ createdAt: 1 });

    // Identify which ones are liked by current user
    const commentsWithLikes = await Promise.all(
      comments.map(async (c) => {
        const isLiked = await Like.exists({ user: req.user.id, comment: c._id });
        return {
          ...c.toObject(),
          isLiked: !!isLiked,
        };
      })
    );

    res.status(200).json({
      success: true,
      comments: commentsWithLikes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    const post = await Post.findById(comment.post);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Associated post not found' });
    }

    // Owner of comment or owner of post or admin can delete
    if (
      comment.user.toString() !== req.user.id &&
      post.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this comment' });
    }

    // Count replies to delete them too
    const replies = await Comment.find({ parentComment: comment._id });
    const replyIds = replies.map((r) => r._id);
    
    // Delete replies & comment
    await Comment.deleteMany({ _id: { $in: [comment._id, ...replyIds] } });
    await Like.deleteMany({ comment: { $in: [comment._id, ...replyIds] } });

    // Decrement commentsCount (comment + replies)
    const deletedCount = 1 + replyIds.length;
    post.commentsCount = Math.max(0, (post.commentsCount || 0) - deletedCount);
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      commentsCount: post.commentsCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a comment
// @route   PUT /api/comments/:id
// @access  Private
export const editComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to edit this comment' });
    }

    comment.content = content;
    await comment.save();

    // Trigger mentions again for newly added handles
    await handleMentions(content, req.user.id, comment.post, comment._id);

    const populated = await Comment.findById(comment._id).populate('user', 'username profilePic isVerified');

    res.status(200).json({
      success: true,
      comment: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like or Unlike a comment
// @route   POST /api/comments/:id/like
// @access  Private
export const toggleLikeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    const alreadyLiked = await Like.findOne({ user: req.user.id, comment: comment._id });

    if (alreadyLiked) {
      // Unlike
      await alreadyLiked.deleteOne();
      comment.likesCount = Math.max(0, (comment.likesCount || 0) - 1);
      await comment.save();

      return res.status(200).json({ success: true, isLiked: false, likesCount: comment.likesCount });
    } else {
      // Like
      await Like.create({ user: req.user.id, comment: comment._id });
      comment.likesCount = (comment.likesCount || 0) + 1;
      await comment.save();

      // Notify comment owner
      if (comment.user.toString() !== req.user.id) {
        await Notification.create({
          sender: req.user.id,
          receiver: comment.user,
          type: 'like',
          post: comment.post,
          comment: comment._id,
          text: 'liked your comment.',
        });
      }

      return res.status(200).json({ success: true, isLiked: true, likesCount: comment.likesCount });
    }
  } catch (error) {
    next(error);
  }
};
