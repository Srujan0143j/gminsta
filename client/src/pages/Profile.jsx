import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProfileSkeleton } from '../components/SkeletonLoader';
import {
  Grid,
  Bookmark,
  Settings,
  MoreHorizontal,
  Lock,
  Plus,
  Play,
  Loader2,
  Trash2,
  LogOut,
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import PostCard from '../components/PostCard';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'saved'
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // Selected post view details
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isLoadingPost, setIsLoadingPost] = useState(false);

  // Highlights state
  const [highlights, setHighlights] = useState({});
  const [activeHighlightStories, setActiveHighlightStories] = useState(null);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Profile info
      const profileRes = await api.get(`/users/profile/${username}`);
      if (profileRes.data.success) {
        setProfile(profileRes.data.profile);

        // 2. Fetch User Posts
        // Only fetch if account is public OR we follow them OR it is our own account
        const canViewContent =
          !profileRes.data.profile.isPrivate ||
          profileRes.data.profile.followStatus === 'following' ||
          profileRes.data.profile._id === currentUser?._id;

        if (canViewContent) {
          const postsRes = await api.get(`/posts/user/${username}`);
          if (postsRes.data.success) {
            setPosts(postsRes.data.posts);
          }

          // Fetch highlights
          const highlightsRes = await api.get(`/stories/highlights/${username}`);
          if (highlightsRes.data.success) {
            setHighlights(highlightsRes.data.highlights);
          }

          // 3. Fetch Saved Posts (only for self)
          if (profileRes.data.profile._id === currentUser?._id) {
            const savedRes = await api.get('/posts/saved');
            if (savedRes.data.success) {
              setSavedPosts(savedRes.data.posts);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [username, username === currentUser?.username]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    const isFollowing = profile.followStatus === 'following';
    const endpoint = isFollowing ? `/users/unfollow/${profile._id}` : `/users/follow/${profile._id}`;

    try {
      const res = await api.post(endpoint);
      if (res.data.success) {
        setProfile((prev) => ({
          ...prev,
          followStatus: res.data.followStatus,
          followersCount: isFollowing ? prev.followersCount - 1 : res.data.followStatus === 'following' ? prev.followersCount + 1 : prev.followersCount,
        }));
        // Reload content in case status changed to accepted
        fetchProfileData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlockToggle = async () => {
    if (!profile) return;
    try {
      const res = await api.post(`/users/block/${profile._id}`);
      if (res.data.success) {
        setProfile((prev) => ({
          ...prev,
          isBlocked: res.data.isBlocked,
        }));
        setIsOptionsOpen(false);
        fetchProfileData(); // refresh relationship states
      }
    } catch (err) {
      console.error(err);
    }
  };

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
    fetchProfileData(); // refresh grids metrics
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) return null;

  const isSelf = profile._id === currentUser?._id;
  const canViewContent = !profile.isPrivate || profile.followStatus === 'following' || isSelf;

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8">
      {/* Top Profile Header Info */}
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-16 px-4">
        {/* Profile Pic */}
        <div className="relative">
          <img
            src={profile.profilePic || '/uploads/default-avatar.png'}
            alt={profile.username}
            className="w-20 h-20 md:w-36 md:h-36 rounded-full object-cover border-4 border-premium-lightBorder dark:border-premium-darkBorder shadow-md"
          />
        </div>

        {/* Info detail */}
        <div className="flex-1 space-y-4 w-full text-center md:text-left">
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
            <div className="flex items-center space-x-1.5 justify-center md:justify-start">
              <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{profile.username}</h2>
              {profile.isVerified && (
                <span className="w-4 h-4 rounded-full bg-instagram-blue flex items-center justify-center text-[8px] text-white font-bold">✓</span>
              )}
            </div>

            <div className="flex items-center space-x-2 justify-center sm:justify-start">
              {isSelf ? (
                <>
                  <button
                    onClick={() => navigate('/settings')}
                    className="px-4 py-2 border border-premium-lightBorder dark:border-premium-darkBorder rounded-xl text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-premium-darkCard transition shadow-sm"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="p-2 border border-premium-lightBorder dark:border-premium-darkBorder rounded-xl hover:bg-neutral-50 dark:hover:bg-premium-darkCard text-neutral-600 dark:text-neutral-300 transition shadow-sm"
                  >
                    <Settings size={14} />
                  </button>
                  <button
                    onClick={logout}
                    className="p-2 border border-red-200 dark:border-red-950/20 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/10 text-instagram-red transition shadow-sm md:hidden"
                    title="Logout"
                  >
                    <LogOut size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleFollowToggle}
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition shadow-sm ${
                      profile.followStatus === 'following'
                        ? 'border border-premium-lightBorder dark:border-premium-darkBorder hover:bg-red-50 dark:hover:bg-red-950/20 text-instagram-red'
                        : profile.followStatus === 'requested'
                        ? 'border border-premium-lightBorder dark:border-premium-darkBorder text-neutral-500 bg-neutral-50'
                        : 'bg-instagram-blue hover:bg-instagram-darkBlue text-white'
                    }`}
                  >
                    {profile.followStatus === 'following'
                      ? 'Unfollow'
                      : profile.followStatus === 'requested'
                      ? 'Requested'
                      : 'Follow'}
                  </button>

                  {profile.followStatus === 'following' && (
                    <button
                      onClick={() => navigate('/messages', { state: { startChatWith: profile } })}
                      className="px-4 py-2.5 border border-premium-lightBorder dark:border-premium-darkBorder rounded-xl text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-premium-darkCard transition shadow-sm"
                    >
                      Message
                    </button>
                  )}

                  <button
                    onClick={() => setIsOptionsOpen(true)}
                    className="p-2.5 border border-premium-lightBorder dark:border-premium-darkBorder rounded-xl hover:bg-neutral-50 dark:hover:bg-premium-darkCard transition shadow-sm"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Counts Row */}
          <div className="flex space-x-6 justify-center md:justify-start text-sm">
            <span>
              <strong className="font-bold">{profile.postsCount}</strong> posts
            </span>
            <span>
              <strong className="font-bold">{profile.followersCount}</strong> followers
            </span>
            <span>
              <strong className="font-bold">{profile.followingCount}</strong> following
            </span>
          </div>

          {/* Bio Description Row */}
          <div className="text-sm space-y-1 max-w-md mx-auto md:mx-0">
            <h1 className="font-bold text-neutral-800 dark:text-neutral-100">{profile.fullname}</h1>
            {profile.bio && <p className="text-neutral-600 dark:text-neutral-300 select-text whitespace-pre-line">{profile.bio}</p>}
            {profile.website && (
              <a
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noreferrer"
                className="text-instagram-blue hover:underline font-medium block"
              >
                {profile.website}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Highlights Bar */}
      {canViewContent && Object.keys(highlights).length > 0 && (
        <div className="flex space-x-4 px-4 overflow-x-auto no-scrollbar py-2 border-t border-b border-neutral-50 dark:border-premium-darkBorder bg-white/40 dark:bg-premium-darkCard/20 rounded-2xl">
          {Object.entries(highlights).map(([name, stories]) => (
            <div
              key={name}
              onClick={() => setActiveHighlightStories(stories)}
              className="flex flex-col items-center space-y-1.5 min-w-[70px] cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-full p-[2px] border-2 border-premium-lightBorder dark:border-premium-darkBorder group-hover:scale-105 transition-transform duration-300">
                <img
                  src={stories[0]?.mediaUrl || '/uploads/default-avatar.png'}
                  alt={name}
                  className="w-full h-full rounded-full object-cover border border-white dark:border-premium-darkBg bg-neutral-100"
                />
              </div>
              <span className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 truncate max-w-[64px]">
                {name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab Selectors */}
      {canViewContent ? (
        <div className="space-y-4">
          <div className="flex justify-center border-t border-premium-lightBorder dark:border-premium-darkBorder">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center space-x-2 py-4 px-8 border-t-2 text-xs font-bold uppercase tracking-wider transition duration-300 ${
                activeTab === 'posts'
                  ? 'border-instagram-blue text-instagram-blue'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <Grid size={14} />
              <span>Posts</span>
            </button>

            {isSelf && (
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex items-center space-x-2 py-4 px-8 border-t-2 text-xs font-bold uppercase tracking-wider transition duration-300 ${
                  activeTab === 'saved'
                    ? 'border-instagram-blue text-instagram-blue'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
              >
                <Bookmark size={14} />
                <span>Saved</span>
              </button>
            )}
          </div>

          {/* Grid visualizer */}
          <div className="grid grid-cols-3 gap-1 md:gap-4 px-2">
            {(activeTab === 'posts' ? posts : savedPosts).map((post) => (
              <div
                key={post._id}
                onClick={() => handleOpenPost(post._id)}
                className="relative aspect-square bg-neutral-900 rounded-lg overflow-hidden group cursor-pointer border border-premium-lightBorder dark:border-premium-darkBorder shadow-sm"
              >
                {post.media[0]?.type === 'video' ? (
                  <div className="w-full h-full relative">
                    <video src={post.media[0].url} className="w-full h-full object-cover" muted />
                    <Play size={16} className="absolute top-2 right-2 text-white fill-white opacity-75" />
                  </div>
                ) : (
                  <img src={post.media[0]?.url} alt="profile post" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-6 text-white font-bold text-xs md:text-sm transition-opacity duration-300">
                  <div className="flex items-center space-x-1.5">
                    <span>❤️</span>
                    <span>{post.likesCount || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span>💬</span>
                    <span>{post.commentsCount || 0}</span>
                  </div>
                </div>
              </div>
            ))}

            {(activeTab === 'posts' ? posts : savedPosts).length === 0 && (
              <div className="col-span-3 text-center py-20 text-neutral-400 text-sm">
                No posts to show.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Private Account Locked Panel */
        <div className="border border-premium-lightBorder dark:border-premium-darkBorder rounded-2xl bg-white dark:bg-premium-darkCard p-8 text-center max-w-sm mx-auto space-y-4 shadow-sm animate-fade-in">
          <div className="mx-auto w-12 h-12 rounded-full border-2 border-neutral-400 flex items-center justify-center text-neutral-400">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-100">This Account is Private</h3>
            <p className="text-xs text-neutral-400 mt-1">Follow this account to see their photos and videos.</p>
          </div>
        </div>
      )}

      {/* Options Dropdown Modal (block/unblock) */}
      <Modal isOpen={isOptionsOpen} onClose={() => setIsOptionsOpen(false)} title="Options">
        <div className="flex flex-col text-center">
          <button
            onClick={handleBlockToggle}
            className="w-full py-3 hover:bg-neutral-50 dark:hover:bg-premium-darkBorder text-instagram-red font-bold rounded-xl transition"
          >
            {profile.isBlocked ? 'Unblock User' : 'Block User'}
          </button>
        </div>
      </Modal>

      {/* Post details modal popup */}
      <Modal isOpen={selectedPostId !== null} onClose={handleClosePost} title="Post Detail">
        {isLoadingPost ? (
          <div className="py-12 flex justify-center"><Loader2 size={24} className="animate-spin text-neutral-400" /></div>
        ) : (
          selectedPost && <PostCard post={selectedPost} onDelete={handleClosePost} />
        )}
      </Modal>

      {/* timed timed highlights stories viewer overlay */}
      {activeHighlightStories && (
        <HighlightStoriesViewer
          stories={activeHighlightStories}
          onClose={() => setActiveHighlightStories(null)}
        />
      )}

    </div>
  );
};

// Simplified Timed viewer for Highlights
const HighlightStoriesViewer = ({ stories, onClose }) => {
  const [idx, setIdx] = useState(0);
  const story = stories[idx];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (idx < stories.length - 1) {
        setIdx((prev) => prev + 1);
      } else {
        onClose();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [idx, stories.length]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-neutral-900/90" onClick={onClose} />
      <button onClick={onClose} className="absolute top-6 right-6 text-white text-xl z-20">✕</button>
      <div className="relative w-full max-w-[420px] aspect-[9/16] bg-black overflow-hidden shadow-2xl flex items-center justify-center z-10">
        
        {/* Top Progress bar */}
        <div className="absolute top-3 inset-x-3 z-30 flex space-x-1">
          {stories.map((_, i) => (
            <div key={i} className="h-1 bg-white/20 rounded-full flex-1 overflow-hidden">
              <div
                className="h-full bg-white transition-all ease-linear"
                style={{ width: i < idx ? '100%' : i === idx ? '50%' : '0%' }} // simplified linear progress
              />
            </div>
          ))}
        </div>

        {story.mediaType === 'video' ? (
          <video src={story.mediaUrl} className="w-full h-full object-contain" autoPlay muted playsInline />
        ) : (
          <img src={story.mediaUrl} alt="highlight" className="w-full h-full object-contain" />
        )}
      </div>
    </div>
  );
};

export default Profile;
