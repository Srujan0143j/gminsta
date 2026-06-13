import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const StoryViewer = ({ feed, initialGroupIndex, onClose }) => {
  const { user } = useAuth();
  
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [viewers, setViewers] = useState([]);
  const [showViewers, setShowViewers] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const activeGroup = feed[groupIndex];
  const activeStory = activeGroup?.stories[storyIndex];

  const timerRef = useRef(null);

  // Setup viewer lists if self story
  useEffect(() => {
    const fetchViewers = async () => {
      if (activeStory && activeGroup.user._id.toString() === user?._id) {
        try {
          const res = await api.get(`/stories/${activeStory._id}/viewers`);
          if (res.data.success) {
            setViewers(res.data.viewers);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setViewers([]);
      }
    };

    fetchViewers();
  }, [activeStory, groupIndex, storyIndex, user]);

  // Record story view when loaded
  useEffect(() => {
    const recordView = async () => {
      if (activeStory && activeGroup.user._id.toString() !== user?._id) {
        try {
          await api.post(`/stories/${activeStory._id}/view`);
        } catch (err) {
          console.error('Failed to log story view:', err);
        }
      }
    };

    recordView();
  }, [activeStory, groupIndex, storyIndex, user]);

  // Story Timer & Progress Bar Loop
  useEffect(() => {
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);

    const intervalTime = 100; // tick every 100ms
    const totalDuration = 5000; // 5 seconds per story
    const increment = (intervalTime / totalDuration) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          handleNext();
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [groupIndex, storyIndex]);

  const handleNext = () => {
    if (storyIndex < activeGroup.stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else if (groupIndex < feed.length - 1) {
      setGroupIndex((prev) => prev + 1);
      setStoryIndex(0);
    } else {
      onClose(); // end of feed
    }
  };

  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((prev) => prev - 1);
      // go to last story of previous group
      setStoryIndex(feed[groupIndex - 1].stories.length - 1);
    }
  };

  const handleLikeStory = async () => {
    if (!activeStory) return;
    try {
      const res = await api.post(`/stories/${activeStory._id}/like`);
      if (res.data.success) {
        activeStory.isLiked = res.data.isLiked;
        // Trigger a force re-render
        setStoryIndex((prev) => prev);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSendingReply(true);
    try {
      // Stories replies are sent as DMs targeting the story user
      await api.post('/messages', {
        text: `Replied to your story: "${replyText}"`,
        recipientId: activeGroup.user._id,
      });
      setReplyText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingReply(false);
    }
  };

  if (!activeGroup || !activeStory) return null;

  const isSelfStory = activeGroup.user._id.toString() === user?._id;

  return (
    <div className="fixed inset-0 bg-neutral-950 z-50 flex items-center justify-center select-none overflow-hidden md:p-4">
      {/* Background Close Clicker */}
      <div className="absolute inset-0 z-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Navigation Buttons */}
      <button
        onClick={handlePrev}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center z-10 transition duration-300"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={handleNext}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center z-10 transition duration-300"
      >
        <ChevronRight size={24} />
      </button>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/75 hover:text-white z-20 transition"
      >
        <X size={26} />
      </button>

      {/* Main Viewer Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-[420px] aspect-[9/16] bg-neutral-900 md:rounded-2xl overflow-hidden shadow-2xl flex flex-col z-10"
      >
        
        {/* Top Progress Bars */}
        <div className="absolute top-3 inset-x-3 z-30 flex space-x-1">
          {activeGroup.stories.map((s, idx) => (
            <div key={s._id} className="h-1 bg-white/25 rounded-full flex-1 overflow-hidden">
              <div
                className="h-full bg-white transition-all ease-linear"
                style={{
                  width:
                    idx < storyIndex
                      ? '100%'
                      : idx === storyIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* User Info Header */}
        <div className="absolute top-6 inset-x-4 z-30 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={activeGroup.user.profilePic || '/uploads/default-avatar.png'}
              alt={activeGroup.user.username}
              className="w-9 h-9 rounded-full object-cover border border-white/20"
            />
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-white text-xs font-semibold">{activeGroup.user.username}</span>
                {activeGroup.user.isVerified && (
                  <span className="w-3.5 h-3.5 rounded-full bg-instagram-blue flex items-center justify-center text-[7px] text-white font-bold">
                    ✓
                  </span>
                )}
              </div>
              <span className="text-[10px] text-white/60">
                {new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Left/Right click triggers */}
        <div className="absolute inset-y-12 inset-x-0 z-20 flex">
          <div className="w-1/3 h-full cursor-w-resize" onClick={handlePrev} />
          <div className="w-2/3 h-full cursor-e-resize" onClick={handleNext} />
        </div>

        {/* Story Content Rendering */}
        <div className="flex-1 w-full h-full relative z-10 bg-black flex items-center justify-center">
          {activeStory.mediaType === 'video' ? (
            <video
              src={activeStory.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <img
              src={activeStory.mediaUrl}
              alt="story content"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Bottom Bar: Action overlays */}
        <div className="absolute bottom-4 inset-x-4 z-30 flex items-center space-x-3">
          {isSelfStory ? (
            <div className="flex items-center justify-between w-full">
              {/* Viewer listing indicator */}
              <button
                onClick={() => setShowViewers(true)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs backdrop-blur transition"
              >
                <Eye size={16} />
                <span>{viewers.length} Viewers</span>
              </button>

              <button
                onClick={handleLikeStory}
                className="p-2.5 rounded-full bg-white/10 text-white backdrop-blur"
              >
                <Heart size={20} className={activeStory.isLiked ? 'fill-instagram-red text-instagram-red' : ''} />
              </button>
            </div>
          ) : (
            <>
              {/* Story DM reply input */}
              <form onSubmit={handleSendReply} className="flex-1 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={`Reply to ${activeGroup.user.username}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-full border border-white/20 bg-black/45 text-white placeholder-white/60 text-xs focus:outline-none focus:ring-1 focus:ring-white/40 transition"
                />
              </form>

              <button
                onClick={handleLikeStory}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur transition"
              >
                <Heart size={20} className={activeStory.isLiked ? 'fill-instagram-red text-instagram-red' : ''} />
              </button>
            </>
          )}
        </div>

        {/* Sliding Viewers drawer */}
        <AnimatePresence>
          {showViewers && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute inset-x-0 bottom-0 max-h-[50%] bg-neutral-900 border-t border-white/10 rounded-t-2xl z-40 p-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                <h3 className="text-white text-sm font-bold">Story Viewers ({viewers.length})</h3>
                <button onClick={() => setShowViewers(false)} className="text-white/60 text-xs">
                  Close
                </button>
              </div>

              <div className="space-y-3">
                {viewers.map((v) => (
                  <div key={v._id} className="flex items-center space-x-3">
                    <img
                      src={v.profilePic || '/uploads/default-avatar.png'}
                      alt={v.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="text-white text-xs font-semibold">{v.username}</span>
                        {v.isVerified && (
                          <span className="w-3.5 h-3.5 rounded-full bg-instagram-blue flex items-center justify-center text-[7px] text-white font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/50">{v.fullname}</span>
                    </div>
                  </div>
                ))}

                {viewers.length === 0 && (
                  <p className="text-xs text-white/40 text-center py-6">No viewers yet.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

export default StoryViewer;
