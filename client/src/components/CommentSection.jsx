import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, Trash2, CornerDownRight, Send, Loader2 } from 'lucide-react';
import api from '../services/api';

const CommentSection = ({ postId, onCommentsCountChange }) => {
  const { user } = useAuth();
  
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputContent, setInputContent] = useState('');
  const [replyTarget, setReplyTarget] = useState(null); // { _id, username }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/${postId}`);
      if (res.data.success) {
        setComments(res.data.comments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(`/comments/${postId}`, {
        content: inputContent,
        parentComment: replyTarget?._id || null,
      });

      if (res.data.success) {
        setInputContent('');
        setReplyTarget(null);
        
        // Add new comment to state and update count
        setComments((prev) => [...prev, res.data.comment]);
        if (onCommentsCountChange) onCommentsCountChange(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await api.delete(`/comments/${commentId}`);
      if (res.data.success) {
        // Remove comment + replies matching this ID as parent from local state
        setComments((prev) => prev.filter((c) => c._id !== commentId && c.parentComment !== commentId));
        if (onCommentsCountChange) onCommentsCountChange(-1); // can decrease more if replies deleted, but post controller updates
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const res = await api.post(`/comments/${commentId}/like`);
      if (res.data.success) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? { ...c, isLiked: res.data.isLiked, likesCount: res.data.likesCount }
              : c
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Nesting layout calculation
  // Separate top-level comments and replies
  const rootComments = comments.filter((c) => !c.parentComment);
  const replies = comments.filter((c) => c.parentComment);

  const getRepliesForComment = (parentId) => {
    return replies.filter((r) => r.parentComment === parentId);
  };

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[60vh] justify-between">
      
      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 scrollbar-thin scrollbar-thumb-premium-darkBorder">
        {rootComments.map((comment) => {
          const commentReplies = getRepliesForComment(comment._id);
          
          return (
            <div key={comment._id} className="space-y-3">
              {/* Parent Comment */}
              <div className="flex items-start justify-between group">
                <div className="flex space-x-3">
                  <img
                    src={comment.user?.profilePic || '/uploads/default-avatar.png'}
                    alt={comment.user?.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-neutral-800 dark:text-neutral-100">
                        {comment.user?.username}
                      </span>
                      {comment.user?.isVerified && (
                        <span className="w-3.5 h-3.5 rounded-full bg-instagram-blue flex items-center justify-center text-[7px] text-white font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    
                    {/* Render content with highlight handles */}
                    <p className="text-[12px] text-neutral-700 dark:text-neutral-300 mt-0.5 select-text">
                      {comment.content.split(' ').map((word, idx) => {
                        if (word.startsWith('@')) {
                          return <span key={idx} className="text-instagram-blue font-medium">{word} </span>;
                        }
                        return <span key={idx}>{word} </span>;
                      })}
                    </p>

                    <div className="flex items-center space-x-3 mt-1 text-[10px] text-neutral-400 font-semibold">
                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      {comment.likesCount > 0 && <span>{comment.likesCount} likes</span>}
                      <button
                        onClick={() => setReplyTarget({ _id: comment._id, username: comment.user.username })}
                        className="hover:underline"
                      >
                        Reply
                      </button>
                      {(comment.user?._id === user?._id || user?.role === 'admin') && (
                        <button onClick={() => handleDeleteComment(comment._id)} className="text-instagram-red hover:underline flex items-center space-x-0.5">
                          <Trash2 size={10} />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <button onClick={() => handleLikeComment(comment._id)} className="text-neutral-400 hover:scale-105 transition">
                  <Heart
                    size={13}
                    className={comment.isLiked ? 'fill-instagram-red text-instagram-red' : ''}
                  />
                </button>
              </div>

              {/* Child Replies */}
              {commentReplies.map((reply) => (
                <div key={reply._id} className="flex items-start justify-between group pl-8">
                  <div className="flex space-x-2.5">
                    <CornerDownRight size={14} className="text-neutral-300 mt-1" />
                    <img
                      src={reply.user?.profilePic || '/uploads/default-avatar.png'}
                      alt={reply.user?.username}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-[11px] text-neutral-800 dark:text-neutral-100">
                          {reply.user?.username}
                        </span>
                        {reply.user?.isVerified && (
                          <span className="w-3 h-3 rounded-full bg-instagram-blue flex items-center justify-center text-[6px] text-white font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      
                      <p className="text-[11px] text-neutral-700 dark:text-neutral-300 mt-0.5 select-text">
                        {reply.content.split(' ').map((word, idx) => {
                          if (word.startsWith('@')) {
                            return <span key={idx} className="text-instagram-blue font-medium">{word} </span>;
                          }
                          return <span key={idx}>{word} </span>;
                        })}
                      </p>

                      <div className="flex items-center space-x-3 mt-1 text-[9px] text-neutral-400 font-semibold">
                        <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                        {reply.likesCount > 0 && <span>{reply.likesCount} likes</span>}
                        {(reply.user?._id === user?._id || user?.role === 'admin') && (
                          <button onClick={() => handleDeleteComment(reply._id)} className="text-instagram-red hover:underline flex items-center space-x-0.5">
                            <Trash2 size={10} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <button onClick={() => handleLikeComment(reply._id)} className="text-neutral-400 hover:scale-105 transition">
                    <Heart
                      size={12}
                      className={reply.isLiked ? 'fill-instagram-red text-instagram-red' : ''}
                    />
                  </button>
                </div>
              ))}
            </div>
          );
        })}

        {comments.length === 0 && (
          <p className="text-xs text-neutral-400 text-center py-12">No comments yet. Start the conversation!</p>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmitComment} className="border-t border-neutral-100 dark:border-premium-darkBorder pt-3 space-y-2">
        {replyTarget && (
          <div className="flex items-center justify-between bg-neutral-50 dark:bg-premium-darkCard px-3 py-1.5 rounded-lg text-[10px] text-neutral-500">
            <span>Replying to <span className="font-bold text-instagram-blue">@{replyTarget.username}</span></span>
            <button type="button" onClick={() => setReplyTarget(null)} className="text-neutral-400 hover:text-neutral-600">Cancel</button>
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            placeholder={replyTarget ? "Write a reply..." : "Add a comment..."}
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-full border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkCard text-xs focus:outline-none focus:ring-2 focus:ring-instagram-blue text-neutral-800 dark:text-neutral-100 placeholder-neutral-400"
          />
          <button
            type="submit"
            disabled={!inputContent.trim() || isSubmitting}
            className="absolute right-3 top-2.5 text-instagram-blue disabled:text-neutral-300 dark:disabled:text-premium-darkBorder transition hover:scale-105"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </form>

    </div>
  );
};

export default CommentSection;
