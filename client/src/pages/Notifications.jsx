import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Heart, MessageSquare, UserPlus, FileText, CheckCheck, Trash2 } from 'lucide-react';

const Notifications = () => {
  const { notifications, unreadCount, markAllAsRead, clearAllNotifications } = useSocket();
  const navigate = useNavigate();

  // Auto-mark notifications as read when page is viewed
  useEffect(() => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  }, [unreadCount]);

  const handleNotificationClick = (n) => {
    // Navigate to respective page depending on trigger
    if (n.post) {
      // Directs to home feed or profile, or opens detail
      navigate('/');
    } else if (n.sender) {
      navigate(`/profile/${n.sender.username}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
      case 'story_reaction':
        return <Heart size={14} className="text-instagram-red fill-instagram-red" />;
      case 'comment':
        return <MessageSquare size={14} className="text-emerald-500 fill-emerald-500" />;
      case 'follow':
      case 'follow_request':
        return <UserPlus size={14} className="text-instagram-blue" />;
      case 'mention':
        return <FileText size={14} className="text-purple-500" />;
      default:
        return <Heart size={14} />;
    }
  };

  return (
    <div className="max-w-xl mx-auto py-4 space-y-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-premium-lightBorder dark:border-premium-darkBorder pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-neutral-800 dark:text-white">Notifications</h2>
          <p className="text-xs text-neutral-400">View likes, comments, mentions, and new followers.</p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="flex items-center space-x-1 text-xs text-instagram-red hover:underline font-semibold"
          >
            <Trash2 size={13} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n._id}
            onClick={() => handleNotificationClick(n)}
            className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-neutral-50 dark:hover:bg-premium-darkCard hover:border-premium-lightBorder dark:hover:border-premium-darkBorder transition duration-300 ${
              !n.isRead
                ? 'bg-instagram-blue/5 border-instagram-blue/20 dark:bg-instagram-blue/5 dark:border-instagram-blue/10'
                : 'bg-white dark:bg-premium-darkCard border-premium-lightBorder dark:border-premium-darkBorder'
            }`}
          >
            <div className="flex items-center space-x-3.5">
              {/* Icon Overlay Badge */}
              <div className="relative">
                <img
                  src={n.sender?.profilePic || '/uploads/default-avatar.png'}
                  alt={n.sender?.username}
                  className="w-10 h-10 rounded-full object-cover border border-premium-lightBorder dark:border-premium-darkBorder"
                />
                <span className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-premium-darkCard rounded-full shadow border border-premium-lightBorder dark:border-premium-darkBorder">
                  {getNotificationIcon(n.type)}
                </span>
              </div>

              <div>
                <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-200">
                  <span className="font-bold text-neutral-800 dark:text-white mr-1">
                    {n.sender?.username}
                  </span>
                  {n.text || 'performed an action.'}
                </p>
                
                {/* Preview text for comments/mentions */}
                {n.comment && (
                  <p className="text-[10px] text-neutral-400 italic mt-0.5 truncate max-w-xs select-text">
                    "{n.comment.content}"
                  </p>
                )}

                <span className="text-[9px] text-neutral-400 font-semibold uppercase tracking-wider block mt-1">
                  {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at{' '}
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Post image thumbnail preview */}
            {n.post && n.post.media && n.post.media[0] && (
              <img
                src={n.post.media[0].url}
                alt="post preview"
                className="w-10 h-10 rounded-lg object-cover border border-premium-lightBorder dark:border-premium-darkBorder"
              />
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="text-center py-20 text-neutral-500 bg-white dark:bg-premium-darkCard border border-premium-lightBorder dark:border-premium-darkBorder rounded-2xl p-6">
            <Heart size={36} className="text-neutral-300 mx-auto mb-3" />
            <p className="font-bold text-sm">No notifications yet</p>
            <p className="text-xs text-neutral-400 mt-1">Activities matching your posts will show up here.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Notifications;
