import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import StoryViewer from './StoryViewer';

const StoryBar = () => {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Viewer states
  const [activeGroupIndex, setActiveGroupIndex] = useState(null);

  const fetchStories = async () => {
    try {
      const res = await api.get('/stories/feed');
      if (res.data.success) {
        setFeed(res.data.feed);
      }
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Handle uploading story
  const handleUploadStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('media', file);

    try {
      const res = await api.post('/stories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        fetchStories();
      }
    } catch (err) {
      console.error('Story upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const hasSelfStories = feed.some((group) => group.user._id.toString() === user?._id);

  if (isLoading) {
    return (
      <div className="flex space-x-4 p-2 overflow-x-auto no-scrollbar">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-premium-darkBorder animate-pulse min-w-[64px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4 p-4 overflow-x-auto no-scrollbar border border-premium-lightBorder dark:border-premium-darkBorder bg-white dark:bg-premium-darkCard rounded-2xl shadow-sm mb-6 transition-all duration-300">
      
      {/* Self Story Trigger */}
      <div className="flex flex-col items-center space-y-1 min-w-[72px]">
        <div className="relative">
          {isUploading ? (
            <div className="w-16 h-16 rounded-full border border-premium-lightBorder dark:border-premium-darkBorder flex items-center justify-center bg-neutral-50 dark:bg-premium-darkBg">
              <Loader2 size={16} className="animate-spin text-instagram-blue" />
            </div>
          ) : (
            <div
              onClick={() => {
                if (hasSelfStories) {
                  setActiveGroupIndex(0); // open self stories
                }
              }}
              className={`w-16 h-16 rounded-full p-[2.5px] cursor-pointer ${
                hasSelfStories
                  ? 'story-gradient'
                  : 'border border-premium-lightBorder dark:border-premium-darkBorder'
              }`}
            >
              <img
                src={user?.profilePic || '/uploads/default-avatar.png'}
                alt="Your Avatar"
                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-premium-darkCard"
              />
            </div>
          )}
          
          {/* Add story button */}
          <label className="absolute bottom-0 right-0 p-1 bg-instagram-blue border-2 border-white dark:border-premium-darkCard text-white rounded-full cursor-pointer hover:bg-instagram-darkBlue transition shadow-md">
            <Plus size={10} className="stroke-[3px]" />
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleUploadStory}
              className="hidden"
            />
          </label>
        </div>
        <span className="text-[10px] text-neutral-500 font-medium truncate max-w-[64px]">
          Your Story
        </span>
      </div>

      {/* Followed Users Stories */}
      {feed
        .filter((group) => group.user._id.toString() !== user?._id)
        .map((group, index) => {
          // Adjust index since we filtered out self from mapping (self is always index 0)
          const actualIndex = feed.findIndex((g) => g.user._id.toString() === group.user._id.toString());
          
          return (
            <div
              key={group.user._id}
              onClick={() => setActiveGroupIndex(actualIndex)}
              className="flex flex-col items-center space-y-1 min-w-[72px] cursor-pointer group"
            >
              <div
                className={`w-16 h-16 rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-[1.03] ${
                  group.allViewed
                    ? 'border border-premium-lightBorder dark:border-premium-darkBorder'
                    : 'story-gradient'
                }`}
              >
                <img
                  src={group.user.profilePic || '/uploads/default-avatar.png'}
                  alt={group.user.username}
                  className="w-full h-full rounded-full object-cover border-2 border-white dark:border-premium-darkCard"
                />
              </div>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-white font-medium truncate max-w-[64px]">
                {group.user.username}
              </span>
            </div>
          );
        })}

      {/*timed timed full-screen story viewer overlay */}
      {activeGroupIndex !== null && (
        <StoryViewer
          feed={feed}
          initialGroupIndex={activeGroupIndex}
          onClose={() => {
            setActiveGroupIndex(null);
            fetchStories(); // reload views states
          }}
        />
      )}

    </div>
  );
};

export default StoryBar;
