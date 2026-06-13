import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Plus, Loader2, Search } from 'lucide-react';
import api from '../services/api';
import ChatBox from '../components/ChatBox';
import Modal from '../components/Modal';

const Messages = () => {
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Group creation / New chat modal states
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Group chat states
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const fetchConversations = async (selectConvId = null) => {
    try {
      const res = await api.get('/messages/conversations');
      if (res.data.success) {
        setConversations(res.data.conversations);

        // If a selectConvId is specified, auto-select it
        if (selectConvId) {
          const matching = res.data.conversations.find((c) => c._id === selectConvId);
          if (matching) setActiveChat(matching);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if navigated from another profile to start a new chat
    if (location.state && location.state.startChatWith) {
      const partner = location.state.startChatWith;
      // Setup a temporary activeChat config so that ChatBox fetches/creates it
      // ChatBox has a fallback: if no conversationId is set, it posts using recipientId
      setActiveChat({
        _id: null,
        displayName: partner.fullname || partner.username,
        displayPic: partner.profilePic,
        isGroup: false,
        chatPartner: partner,
        participants: [],
      });
      fetchConversations();
    } else {
      fetchConversations();
    }
  }, [location.state]);

  // Debounced search for starting chat
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/users/search?q=${searchQuery}`);
        if (res.data.success) {
          setSearchResults(res.data.users);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleStartChatDirect = async (partnerUser) => {
    setIsNewChatOpen(false);
    setSearchQuery('');

    // Pre-select or create 1-1 chat
    setActiveChat({
      _id: null,
      displayName: partnerUser.fullname || partnerUser.username,
      displayPic: partnerUser.profilePic,
      isGroup: false,
      chatPartner: partnerUser,
      participants: [],
    });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUserIds.length === 0) return;

    try {
      const res = await api.post('/messages/group', {
        participantIds: selectedUserIds,
        name: groupName,
      });

      if (res.data.success) {
        setIsNewChatOpen(false);
        setGroupName('');
        setSelectedUserIds([]);
        // Auto select the new group conversation
        fetchConversations(res.data.conversation._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserSelect = (uId) => {
    if (selectedUserIds.includes(uId)) {
      setSelectedUserIds((prev) => prev.filter((id) => id !== uId));
    } else {
      setSelectedUserIds((prev) => [...prev, uId]);
    }
  };

  const handleConversationListUpdate = (updatedConv) => {
    // Pull latest conversation states
    fetchConversations(updatedConv._id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto py-2">
      {/* Left Conversations Sidebar List */}
      <div className="md:col-span-1 border border-premium-lightBorder dark:border-premium-darkBorder rounded-2xl bg-white dark:bg-premium-darkCard overflow-hidden h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] flex flex-col shadow-sm transition-colors duration-300">
        <div className="p-4 border-b border-premium-lightBorder dark:border-premium-darkBorder flex justify-between items-center bg-white dark:bg-premium-darkCard">
          <h2 className="text-base font-extrabold text-neutral-800 dark:text-white">Messages</h2>
          <button
            onClick={() => setIsNewChatOpen(true)}
            className="p-1.5 bg-instagram-blue/10 hover:bg-instagram-blue/20 text-instagram-blue rounded-full transition"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-50 dark:divide-premium-darkBorder/40 scrollbar-none">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 size={24} className="animate-spin text-neutral-400" />
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeChat && activeChat._id === conv._id;
              
              return (
                <div
                  key={conv._id}
                  onClick={() => setActiveChat(conv)}
                  className={`flex items-center space-x-3 p-3.5 cursor-pointer hover:bg-neutral-50 dark:hover:bg-premium-darkBg/30 transition ${
                    isActive ? 'bg-neutral-50 dark:bg-premium-darkBg/40 border-l-4 border-instagram-blue' : ''
                  }`}
                >
                  <img
                    src={conv.displayPic || '/uploads/default-avatar.png'}
                    alt={conv.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-premium-lightBorder dark:border-premium-darkBorder"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-xs md:text-sm text-neutral-800 dark:text-neutral-100 block truncate">
                      {conv.displayName}
                    </span>
                    <span className="text-[10px] text-neutral-400 block truncate mt-0.5">
                      {conv.lastMessage?.text || 'Sent media attachment'}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {conversations.length === 0 && !isLoading && (
            <div className="text-center py-20 text-neutral-400 text-xs px-4">
              No conversations. Click the plus button above to start a chat!
            </div>
          )}
        </div>
      </div>

      {/* Right Chat Box Window */}
      <div className="md:col-span-2">
        {activeChat ? (
          <ChatBox activeChat={activeChat} onNewMessageSent={handleConversationListUpdate} />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full border border-premium-lightBorder dark:border-premium-darkBorder rounded-2xl bg-white dark:bg-premium-darkCard text-center p-8 shadow-sm">
            <div className="w-16 h-16 rounded-full border-2 border-neutral-300 flex items-center justify-center text-neutral-400 mb-4 mx-auto">
              <MessageSquare size={26} />
            </div>
            <h3 className="font-extrabold text-sm text-neutral-800 dark:text-white">Your Messages</h3>
            <p className="text-xs text-neutral-400 mt-1">Send private photos and messages to a friend or group.</p>
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="mt-4 px-4 py-2 bg-instagram-blue hover:bg-instagram-darkBlue text-white text-xs font-semibold rounded-xl transition shadow-sm"
            >
              Send Message
            </button>
          </div>
        )}
      </div>

      {/* New Message / Group creation dialog */}
      <Modal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} title="New Message">
        <div className="space-y-4">
          {/* Mode switch */}
          <div className="flex space-x-2 border-b border-neutral-100 dark:border-premium-darkBorder pb-2 text-xs">
            <button
              onClick={() => setIsGroup(false)}
              className={`pb-1 font-bold uppercase ${!isGroup ? 'text-instagram-blue border-b-2 border-instagram-blue' : 'text-neutral-400'}`}
            >
              Direct Chat
            </button>
            <button
              onClick={() => setIsGroup(true)}
              className={`pb-1 font-bold uppercase ${isGroup ? 'text-instagram-blue border-b-2 border-instagram-blue' : 'text-neutral-400'}`}
            >
              Group Chat
            </button>
          </div>

          {isGroup ? (
            /* Group Configuration Form */
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-400">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkCard text-xs focus:outline-none focus:ring-2 focus:ring-instagram-blue"
                />
              </div>

              {/* Members check select list */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400">Select Members</label>
                <input
                  type="text"
                  placeholder="Search user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkCard text-xs focus:outline-none"
                />
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {searchResults.map((su) => (
                    <label key={su._id} className="flex items-center space-x-3 p-1.5 hover:bg-neutral-50 dark:hover:bg-premium-darkBorder rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(su._id)}
                        onChange={() => handleToggleUserSelect(su._id)}
                        className="rounded text-instagram-blue"
                      />
                      <img src={su.profilePic || '/uploads/default-avatar.png'} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-xs text-neutral-800 dark:text-neutral-200">@{su.username}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!groupName.trim() || selectedUserIds.length === 0}
                className="w-full py-2.5 bg-instagram-blue hover:bg-instagram-darkBlue text-white text-xs font-semibold rounded-xl transition"
              >
                Create Group
              </button>
            </form>
          ) : (
            /* Direct Chat Search */
            <div className="space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search username or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkCard text-xs focus:outline-none focus:ring-2 focus:ring-instagram-blue"
                />
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto">
                {searchResults.map((su) => (
                  <div
                    key={su._id}
                    onClick={() => handleStartChatDirect(su)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-premium-darkBorder cursor-pointer transition"
                  >
                    <img src={su.profilePic || '/uploads/default-avatar.png'} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 block">@{su.username}</span>
                      <span className="text-[10px] text-neutral-400 block">{su.fullname}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};

export default Messages;
