import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Send, Bookmark, Volume2, VolumeX, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from './Modal';
import CommentSection from './CommentSection';

const ReelCard = ({ reel: initialReel, isMuted, toggleMute }) => {
  const { user } = useAuth();
  
  const [reel, setReel] = useState(initialReel);
  const [isLiked, setIsLiked] = useState(reel.isLiked);
  const [likesCount, setLikesCount] = useState(reel.likesCount);
  const [isSaved, setIsSaved] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Play/Pause based on scroll visibility using IntersectionObserver
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.75, // Trigger when 75% of card is visible
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
          // Increment views count via API
          api.post(`/reels/${reel._id}/view`).then((res) => {
            if (res.data.success) {
              setReel((prev) => ({ ...prev, viewsCount: res.data.viewsCount }));
            }
          });
        } else {
          videoRef.current?.pause();
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [reel._id]);

  const handleLike = async () => {
    try {
      const res = await api.post(`/reels/${reel._id}/like`);
      if (res.data.success) {
        setIsLiked(res.data.isLiked);
        setLikesCount(res.data.likesCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[360px] aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center snap-start"
    >
      {/* Video Player */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        loop
        playsInline
        muted={isMuted}
        onClick={toggleMute}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Volume Mute Indicator */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full backdrop-blur-sm z-20"
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* Right engagement sidebar overlays */}
      <div className="absolute right-3 bottom-20 flex flex-col space-y-5 items-center z-20 text-white">
        
        {/* Like */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleLike}
            className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition hover:scale-105"
          >
            <Heart size={20} className={isLiked ? 'fill-instagram-red text-instagram-red' : ''} />
          </button>
          <span className="text-[10px] font-bold mt-1 shadow-sm">{likesCount.toLocaleString()}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => setIsCommentsOpen(true)}
            className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition hover:scale-105"
          >
            <MessageCircle size={20} />
          </button>
          <span className="text-[10px] font-bold mt-1 shadow-sm">{reel.commentsCount.toLocaleString()}</span>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition hover:scale-105"
        >
          <Bookmark size={20} className={isSaved ? 'fill-instagram-blue text-instagram-blue' : ''} />
        </button>

        {/* Share */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(reel.videoUrl);
            alert('Reel link copied to clipboard!');
          }}
          className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition hover:scale-105"
        >
          <Send size={18} />
        </button>
      </div>

      {/* Bottom info panel (user, caption, views) */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 z-10 text-white space-y-2">
        <div className="flex items-center space-x-2.5">
          <img
            src={reel.user?.profilePic || '/uploads/default-avatar.png'}
            alt={reel.user?.username}
            className="w-8 h-8 rounded-full object-cover border border-white/20"
          />
          <div className="flex items-center space-x-1">
            <span className="font-bold text-xs">{reel.user?.username}</span>
            {reel.user?.isVerified && (
              <span className="w-3.5 h-3.5 rounded-full bg-instagram-blue flex items-center justify-center text-[7px] text-white font-bold">✓</span>
            )}
          </div>
        </div>

        {reel.caption && (
          <p className="text-[11px] text-neutral-200 line-clamp-2 max-w-[85%] select-text">
            {reel.caption}
          </p>
        )}

        <div className="flex items-center space-x-1.5 text-[9px] text-neutral-300 font-semibold uppercase tracking-wider">
          <Eye size={12} />
          <span>{reel.viewsCount.toLocaleString()} views</span>
        </div>
      </div>

      {/* Reel Comments Drawer */}
      <Modal isOpen={isCommentsOpen} onClose={() => setIsCommentsOpen(false)} title="Comments">
        <CommentSection
          postId={reel._id} // CommentSection works perfectly for Reels too because it targets standard schemas!
          onCommentsCountChange={(change) => {
            setReel((prev) => ({
              ...prev,
              commentsCount: Math.max(0, prev.commentsCount + change),
            }));
          }}
        />
      </Modal>

    </div>
  );
};

export default ReelCard;
