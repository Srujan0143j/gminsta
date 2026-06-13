import React, { useState, useEffect } from 'react';
import { Search, Grid, Loader2, Play } from 'lucide-react';
import { ExploreSkeleton } from '../components/SkeletonLoader';
import api from '../services/api';
import Modal from '../components/Modal';
import PostCard from '../components/PostCard';

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Selected post viewer
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isLoadingPost, setIsLoadingPost] = useState(false);

  const fetchExplore = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/posts/explore');
      if (res.data.success) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExplore();
  }, []);

  // Debounced Search matching users / hashtags
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchedUsers([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (searchQuery.startsWith('#')) {
          // If searching hashtag, retrieve posts from explore matching hashtag query
          const tag = searchQuery.replace('#', '').toLowerCase();
          const res = await api.get(`/posts/explore`); // standard explore
          if (res.data.success) {
            const filtered = res.data.posts.filter((p) =>
              p.hashtags.some((t) => t.includes(tag))
            );
            setPosts(filtered);
          }
        } else {
          // Normal user search
          const res = await api.get(`/users/search?q=${searchQuery}`);
          if (res.data.success) {
            setSearchedUsers(res.data.users);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleOpenPost = async (postId) => {
    setSelectedPostId(postId);
    setIsLoadingPost(true);
    try {
      const res = await api.get(`/posts/${postId}`);
      if (res.data.success) {
        setSelectedPost(res.data.post);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPost(false);
    }
  };

  const handleClosePost = () => {
    setSelectedPostId(null);
    setSelectedPost(null);
    fetchExplore(); // reload grid engagement states
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Search Input */}
      <div className="relative max-w-md mx-auto">
        <Search size={18} className="absolute left-4 top-3.5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search users or type #hashtag to filter posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-10 py-3 rounded-2xl border border-premium-lightBorder dark:border-premium-darkBorder bg-white dark:bg-premium-darkCard text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue shadow-sm transition"
        />
        {isSearching && (
          <Loader2 size={16} className="absolute right-4 top-3.5 animate-spin text-neutral-400" />
        )}
      </div>

      {/* Searched Users List Overlay */}
      {searchQuery && !searchQuery.startsWith('#') && searchedUsers.length > 0 && (
        <div className="bg-white dark:bg-premium-darkCard border border-premium-lightBorder dark:border-premium-darkBorder rounded-2xl p-4 max-w-md mx-auto space-y-3 shadow-xl">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Search Results</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {searchedUsers.map((u) => (
              <div
                key={u._id}
                onClick={() => (window.location.href = `/profile/${u.username}`)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-premium-darkBorder cursor-pointer transition"
              >
                <img src={u.profilePic || '/uploads/default-avatar.png'} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-sm text-neutral-800 dark:text-neutral-100">{u.username}</span>
                    {u.isVerified && (
                      <span className="w-3.5 h-3.5 rounded-full bg-instagram-blue flex items-center justify-center text-[7px] text-white font-bold">✓</span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500">{u.fullname}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explore Grid */}
      {isLoading ? (
        <ExploreSkeleton />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-neutral-400 font-bold text-sm px-1">
            <Grid size={16} />
            <span>Discover Content</span>
          </div>

          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {posts.map((post) => (
              <div
                key={post._id}
                onClick={() => handleOpenPost(post._id)}
                className="relative aspect-square bg-neutral-900 rounded-lg overflow-hidden group cursor-pointer border border-premium-lightBorder dark:border-premium-darkBorder shadow-sm"
              >
                {post.media[0]?.type === 'video' ? (
                  <div className="w-full h-full relative">
                    <video src={post.media[0].url} className="w-full h-full object-cover" muted />
                    <Play size={16} className="absolute top-2 right-2 text-white fill-white stroke-[2px] opacity-75" />
                  </div>
                ) : (
                  <img
                    src={post.media[0]?.url}
                    alt="explore grid"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}

                {/* Hover overlay count metrics */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-6 text-white font-bold text-sm transition-opacity duration-300">
                  <div className="flex items-center space-x-1.5">
                    <span className="fill-white">❤️</span>
                    <span>{post.likesCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span>💬</span>
                    <span>{post.commentsCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}

            {posts.length === 0 && (
              <div className="col-span-3 text-center py-16 text-neutral-500 text-sm">
                No items matching that search.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Modal Detail viewer */}
      <Modal isOpen={selectedPostId !== null} onClose={handleClosePost} title="Post Detail">
        {isLoadingPost ? (
          <div className="py-12 flex justify-center"><Loader2 size={24} className="animate-spin text-neutral-400" /></div>
        ) : (
          selectedPost && <PostCard post={selectedPost} onDelete={handleClosePost} />
        )}
      </Modal>

    </div>
  );
};

export default Explore;
