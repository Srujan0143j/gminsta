import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Send,
  Trash2,
  Archive,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from './Modal';
import CommentSection from './CommentSection';

const PostCard = ({ post: initialPost, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState(initialPost);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [usersWhoLiked, setUsersWhoLiked] = useState([]);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  // Handle double-tap to like
  let lastTap = 0;
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap < DOUBLE_PRESS_DELAY) {
      if (!post.isLiked) {
        handleLike();
      }
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 800);
    }
    lastTap = now;
  };

  const handleLike = async () => {
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      if (res.data.success) {
        setPost((prev) => ({
          ...prev,
          isLiked: res.data.isLiked,
          likesCount: res.data.likesCount,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      const res = await api.post(`/posts/${post._id}/save`);
      if (res.data.success) {
        setPost((prev) => ({
          ...prev,
          isSaved: res.data.isSaved,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await api.delete(`/posts/${post._id}`);
      if (res.data.success) {
        setIsOptionsOpen(false);
        if (onDelete) onDelete(post._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async () => {
    try {
      const res = await api.put(`/posts/${post._id}`, { isArchived: !post.isArchived });
      if (res.data.success) {
        setIsOptionsOpen(false);
        if (onDelete) onDelete(post._id); // remove from active feed
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    try {
      const res = await api.post('/reports', {
        reportedPostId: post._id,
        reason: reportReason,
      });
      if (res.data.success) {
        setIsReportOpen(false);
        setReportReason('');
        setIsOptionsOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLikesList = async () => {
    setIsLikesModalOpen(true);
    setIsLoadingLikes(true);
    try {
      const res = await api.get(`/posts/${post._id}/likes`);
      if (res.data.success) {
        setUsersWhoLiked(res.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLikes(false);
    }
  };

  const handleAddCommentQuick = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      const res = await api.post(`/comments/${post._id}`, { content: commentInput });
      if (res.data.success) {
        setCommentInput('');
        setPost((prev) => ({
          ...prev,
          commentsCount: prev.commentsCount + 1,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const nextMedia = () => {
    if (activeMediaIndex < post.media.length - 1) {
      setActiveMediaIndex((prev) => prev + 1);
    }
  };

  const prevMedia = () => {
    if (activeMediaIndex > 0) {
      setActiveMediaIndex((prev) => prev - 1);
    }
  };

  const formatPostDate = (timestamp) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now - d;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHrs < 1) {
      const mins = Math.floor(diffMs / (1000 * 60));
      return `${mins}m ago`;
    }
    if (diffHrs < 24) {
      return `${diffHrs}h ago`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full max-w-[480px] mx-auto border border-premium-lightBorder dark:border-premium-darkBorder rounded-2xl bg-white dark:bg-premium-darkCard shadow-sm transition-all duration-300 mb-6">
      
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-neutral-50 dark:border-premium-darkBorder">
        <div className="flex items-center space-x-3">
          <img
            src={post.user?.profilePic || '/uploads/default-avatar.png'}
            alt={post.user?.username || 'user'}
            onClick={() => post.user?.username && navigate(`/profile/${post.user.username}`)}
            className="w-9 h-9 rounded-full object-cover border border-premium-lightBorder dark:border-premium-darkBorder cursor-pointer"
          />
          <div>
            <div className="flex items-center space-x-1.5">
              <span
                onClick={() => post.user?.username && navigate(`/profile/${post.user.username}`)}
                className="font-bold text-[13.5px] text-neutral-800 dark:text-neutral-100 hover:text-instagram-blue cursor-pointer transition"
              >
                {post.user?.username || 'deleted_user'}
              </span>
              {post.user?.isVerified && (
                <span className="w-3.5 h-3.5 rounded-full bg-instagram-blue flex items-center justify-center text-[7px] text-white font-bold">
                  ✓
                </span>
              )}
            </div>
            {post.location && (
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block -mt-0.5">
                {post.location}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsOptionsOpen(true)}
          className="text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-premium-darkBorder p-1.5 rounded-full transition"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Media Rendering */}
      <div className="relative aspect-square w-full bg-black flex items-center justify-center select-none" onClick={handleDoubleTap}>
        {post.media.length > 0 && (
          post.media[activeMediaIndex].type === 'video' ? (
            <video
              src={post.media[activeMediaIndex].url}
              className="w-full h-full object-cover"
              controls
              muted
              playsInline
            />
          ) : (
            <img
              src={post.media[activeMediaIndex].url}
              alt="post media"
              className="w-full h-full object-cover"
            />
          )
        )}

        {/* Double-tap heart splash */}
        <AnimatePresence>
          {showHeartPop && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <Heart size={80} className="text-instagram-red fill-instagram-red double-tap-heart" />
            </div>
          )}
        </AnimatePresence>

        {/* Slideshow triggers */}
        {post.media.length > 1 && (
          <>
            {activeMediaIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevMedia();
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 bg-black/60 hover:bg-black text-white rounded-full transition z-10"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {activeMediaIndex < post.media.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextMedia();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 bg-black/60 hover:bg-black text-white rounded-full transition z-10"
              >
                <ChevronRight size={16} />
              </button>
            )}

            {/* Dot indicators */}
            <div className="absolute bottom-3 inset-x-0 z-10 flex items-center justify-center space-x-1">
              {post.media.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activeMediaIndex ? 'w-3.5 bg-instagram-blue' : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Engagement bar */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={handleLike} className="text-neutral-800 dark:text-neutral-100 hover:scale-105 transition duration-200">
            <Heart
              size={23}
              className={post.isLiked ? 'text-instagram-red fill-instagram-red stroke-[2px]' : 'stroke-[2px]'}
            />
          </button>
          <button onClick={() => setIsCommentsOpen(true)} className="text-neutral-800 dark:text-neutral-100 hover:scale-105 transition duration-200">
            <MessageCircle size={23} className="stroke-[2px]" />
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
              alert('Copied shareable post link to clipboard!');
            }}
            className="text-neutral-800 dark:text-neutral-100 hover:scale-105 transition duration-200"
          >
            <Send size={22} className="stroke-[2px]" />
          </button>
        </div>

        <button onClick={handleSave} className="text-neutral-800 dark:text-neutral-100 hover:scale-105 transition duration-200">
          <Bookmark
            size={23}
            className={post.isSaved ? 'text-instagram-blue fill-instagram-blue stroke-[2px]' : 'stroke-[2px]'}
          />
        </button>
      </div>

      {/* Details (likes count, captions, hash links) */}
      <div className="px-4 pb-2 space-y-1 text-xs md:text-sm">
        <span onClick={fetchLikesList} className="font-bold cursor-pointer text-neutral-800 dark:text-neutral-200 hover:underline">
          {(post.likesCount || 0).toLocaleString()} likes
        </span>

        {post.caption && (
          <p className="text-neutral-800 dark:text-neutral-200">
            <span
              onClick={() => post.user?.username && navigate(`/profile/${post.user.username}`)}
              className="font-bold mr-1.5 cursor-pointer hover:text-instagram-blue"
            >
              {post.user?.username || 'deleted_user'}
            </span>
            {/* highlight hashtags */}
            {post.caption.split(' ').map((word, idx) => {
              if (word.startsWith('#')) {
                return (
                  <span key={idx} className="text-instagram-blue font-medium mr-1 select-text">
                    {word}{' '}
                  </span>
                );
              }
              return <span key={idx} className="select-text">{word} </span>;
            })}
          </p>
        )}

        {(post.commentsCount || 0) > 0 && (
          <button
            onClick={() => setIsCommentsOpen(true)}
            className="text-neutral-400 font-medium cursor-pointer block hover:underline text-[11px]"
          >
            View all {post.commentsCount || 0} comments
          </button>
        )}

        <span className="text-[9.5px] text-neutral-400 font-semibold uppercase tracking-wider block pt-0.5">
          {formatPostDate(post.createdAt)}
        </span>
      </div>

      {/* Quick Comment box */}
      <form onSubmit={handleAddCommentQuick} className="px-4 py-2 border-t border-neutral-50 dark:border-premium-darkBorder flex items-center justify-between">
        <input
          type="text"
          placeholder="Add a comment..."
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          className="flex-1 bg-transparent text-xs py-1 border-none focus:outline-none focus:ring-0 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
        />
        <button
          type="submit"
          disabled={!commentInput.trim()}
          className="text-instagram-blue disabled:text-neutral-300 dark:disabled:text-premium-darkBorder text-xs font-bold transition ml-2"
        >
          Post
        </button>
      </form>

      {/* Options Drawer Modal */}
      <Modal isOpen={isOptionsOpen} onClose={() => setIsOptionsOpen(false)} title="Options">
        <div className="flex flex-col space-y-1.5 text-center">
          {post.user?._id === user?._id || user?.role === 'admin' ? (
            <>
              <button
                onClick={handleDelete}
                className="w-full py-3 hover:bg-neutral-50 dark:hover:bg-premium-darkBorder text-instagram-red font-bold rounded-xl flex items-center justify-center space-x-2 transition"
              >
                <Trash2 size={16} />
                <span>Delete Post</span>
              </button>
              <button
                onClick={handleArchive}
                className="w-full py-3 hover:bg-neutral-50 dark:hover:bg-premium-darkBorder text-neutral-800 dark:text-neutral-200 font-semibold rounded-xl flex items-center justify-center space-x-2 transition"
              >
                <Archive size={16} />
                <span>{post.isArchived ? 'Unarchive Post' : 'Archive Post'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsReportOpen(true)}
              className="w-full py-3 hover:bg-neutral-50 dark:hover:bg-premium-darkBorder text-instagram-red font-bold rounded-xl flex items-center justify-center space-x-2 transition"
            >
              <AlertTriangle size={16} />
              <span>Report Post</span>
            </button>
          )}
        </div>
      </Modal>

      {/* Report Form modal */}
      <Modal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} title="Report Post">
        <form onSubmit={handleReport} className="space-y-4">
          <p className="text-xs text-neutral-500">Why are you reporting this post?</p>
          <textarea
            required
            placeholder="Specify reason (e.g. Spam, Harassment, Inappropriate)..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkCard text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
            rows={3}
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsReportOpen(false)}
              className="px-4 py-2 border border-premium-lightBorder dark:border-premium-darkBorder text-xs rounded-xl hover:bg-neutral-50 dark:hover:bg-premium-darkBorder transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-instagram-red text-white text-xs rounded-xl hover:bg-instagram-darkRed transition"
            >
              Submit Report
            </button>
          </div>
        </form>
      </Modal>

      {/* Likes list modal */}
      <Modal isOpen={isLikesModalOpen} onClose={() => setIsLikesModalOpen(false)} title="Likes">
        <div className="space-y-4 max-h-60 overflow-y-auto">
          {isLoadingLikes ? (
            <div className="py-8 flex justify-center"><Loader2Icon className="animate-spin text-neutral-400" /></div>
          ) : (
            usersWhoLiked.map((u) => (
              <div
                key={u._id}
                onClick={() => {
                  setIsLikesModalOpen(false);
                  navigate(`/profile/${u.username}`);
                }}
                className="flex items-center space-x-3 p-1 hover:bg-neutral-50 dark:hover:bg-premium-darkBorder rounded-xl cursor-pointer transition"
              >
                <img src={u.profilePic || '/uploads/default-avatar.png'} alt={u.username} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-100">{u.username}</span>
                    {u.isVerified && (
                      <span className="w-3.5 h-3.5 rounded-full bg-instagram-blue flex items-center justify-center text-[7px] text-white font-bold">✓</span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-500">{u.fullname}</span>
                </div>
              </div>
            ))
          )}
          {usersWhoLiked.length === 0 && !isLoadingLikes && (
            <p className="text-xs text-neutral-500 text-center py-6">No likes yet.</p>
          )}
        </div>
      </Modal>

      {/* Comments Drawer modal */}
      <Modal isOpen={isCommentsOpen} onClose={() => setIsCommentsOpen(false)} title="Comments">
        <CommentSection
          postId={post._id}
          onCommentsCountChange={(change) => {
            setPost((prev) => ({
              ...prev,
              commentsCount: Math.max(0, prev.commentsCount + change),
            }));
          }}
        />
      </Modal>

    </div>
  );
};

const Loader2Icon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default PostCard;
