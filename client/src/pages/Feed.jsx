import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StoryBar from '../components/StoryBar';
import PostCard from '../components/PostCard';
import { PostSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import api from '../services/api';

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = async (pageNumber = 1) => {
    if (pageNumber === 1) setIsLoading(true);
    else setIsMoreLoading(true);

    try {
      const res = await api.get(`/posts/feed?page=${pageNumber}&limit=10`);
      if (res.data.success) {
        if (pageNumber === 1) {
          setPosts(res.data.posts);
        } else {
          setPosts((prev) => [...prev, ...res.data.posts]);
        }
        
        if (res.data.posts.length < 10) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoading(false);
      setIsMoreLoading(false);
    }
  };

  const fetchSuggested = async () => {
    try {
      const res = await api.get('/users/suggested');
      if (res.data.success) {
        setSuggestedUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };

  useEffect(() => {
    fetchFeed(1);
    fetchSuggested();
  }, []);

  const handlePostDeleted = (deletedPostId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedPostId));
  };

  const loadMorePosts = () => {
    if (hasMore && !isMoreLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto py-2">
      {/* Center Feed */}
      <div className="lg:col-span-2 space-y-4">
        {/* Stories */}
        <StoryBar />

        {/* Posts List */}
        {isLoading ? (
          <div className="space-y-6">
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onDelete={handlePostDeleted} />
            ))}

            {posts.length === 0 && (
              <div className="text-center py-20 border border-premium-lightBorder dark:border-premium-darkBorder rounded-2xl bg-white dark:bg-premium-darkCard p-8">
                <p className="text-neutral-500 font-medium">Your feed is empty.</p>
                <p className="text-xs text-neutral-400 mt-1">Start following people or explore posts below!</p>
                <button
                  onClick={() => navigate('/explore')}
                  className="mt-4 px-4 py-2 bg-instagram-blue hover:bg-instagram-darkBlue text-white text-xs font-semibold rounded-xl transition"
                >
                  Explore Posts
                </button>
              </div>
            )}

            {/* Load More Trigger */}
            {hasMore && posts.length > 0 && (
              <div className="text-center pt-4">
                <button
                  onClick={loadMorePosts}
                  disabled={isMoreLoading}
                  className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-premium-darkCard dark:hover:bg-premium-darkBorder text-neutral-600 dark:text-neutral-300 text-xs font-bold rounded-xl transition inline-flex items-center space-x-2"
                >
                  {isMoreLoading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>Load More Posts</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suggested Users Side Panel (Visible on large screens) */}
      <div className="hidden lg:block space-y-6 p-4 border border-premium-lightBorder dark:border-premium-darkBorder bg-white dark:bg-premium-darkCard rounded-2xl h-fit shadow-sm">
        {/* Current User Header */}
        <div className="flex items-center space-x-3">
          <img
            src={user?.profilePic || '/uploads/default-avatar.png'}
            alt={user?.username}
            onClick={() => navigate(`/profile/${user?.username}`)}
            className="w-12 h-12 rounded-full object-cover border border-premium-lightBorder dark:border-premium-darkBorder cursor-pointer"
          />
          <div>
            <div className="flex items-center space-x-1">
              <span
                onClick={() => navigate(`/profile/${user?.username}`)}
                className="font-bold text-sm text-neutral-800 dark:text-neutral-100 cursor-pointer hover:underline"
              >
                {user?.username}
              </span>
              {user?.isVerified && (
                <span className="w-3.5 h-3.5 rounded-full bg-instagram-blue flex items-center justify-center text-[7px] text-white font-bold">✓</span>
              )}
            </div>
            <p className="text-xs text-neutral-500">{user?.fullname}</p>
          </div>
        </div>

        {/* Suggested Panel */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-neutral-400">
            <span>Suggested for you</span>
            <button onClick={() => navigate('/explore')} className="text-instagram-blue hover:text-instagram-darkBlue">See All</button>
          </div>

          <div className="space-y-3">
            {suggestedUsers.map((su) => (
              <div key={su._id} className="flex items-center justify-between">
                <div
                  onClick={() => navigate(`/profile/${su.username}`)}
                  className="flex items-center space-x-2.5 cursor-pointer group"
                >
                  <img
                    src={su.profilePic || '/uploads/default-avatar.png'}
                    alt={su.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 group-hover:text-instagram-blue transition">
                        {su.username}
                      </span>
                      {su.isVerified && (
                        <span className="w-3 h-3 rounded-full bg-instagram-blue flex items-center justify-center text-[6px] text-white font-bold">✓</span>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-400 block -mt-0.5">{su.fullname}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/profile/${su.username}`)}
                  className="text-instagram-blue hover:text-instagram-darkBlue text-[11px] font-bold"
                >
                  View Profile
                </button>
              </div>
            ))}

            {suggestedUsers.length === 0 && (
              <p className="text-xs text-neutral-400 text-center py-4">No suggestions available.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-[10px] text-neutral-400 space-y-2 pt-2 border-t border-neutral-50 dark:border-premium-darkBorder">
          <p>© 2026 GMinsta from Google DeepMind Advanced Agentic Coding.</p>
        </div>
      </div>
    </div>
  );
};

export default Feed;
