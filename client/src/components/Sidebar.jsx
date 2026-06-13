import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import {
  Home,
  Search,
  Compass,
  Film,
  MessageSquare,
  Heart,
  PlusSquare,
  User,
  Shield,
  Sun,
  Moon,
  LogOut,
  X,
  Loader2,
} from 'lucide-react';
import api from '../services/api';
import Modal from './Modal';
import CreatePostFlow from './CreatePostFlow';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Debounced user search
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
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 450); // 450ms debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    {
      name: 'Search',
      action: () => setIsSearchOpen(!isSearchOpen),
      icon: Search,
    },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Reels', path: '/reels', icon: Film },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
    { name: 'Notifications', path: '/notifications', icon: Heart, badge: unreadCount },
    {
      name: 'Create',
      action: () => setIsCreateOpen(true),
      icon: PlusSquare,
    },
    { name: 'Profile', path: `/profile/${user?.username}`, icon: User, isAvatar: true },
  ];

  if (user?.role === 'admin') {
    // Add admin dashboard
    navItems.splice(navItems.length - 1, 0, {
      name: 'Admin',
      path: '/admin',
      icon: Shield,
    });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-20 xl:w-60 border-r border-premium-lightBorder dark:border-premium-darkBorder bg-white dark:bg-premium-darkBg px-3 py-6 z-40 transition-all duration-300">
        {/* Logo */}
        <div className="flex items-center justify-center xl:justify-start px-3 mb-10">
          <h1
            onClick={() => navigate('/')}
            className="hidden xl:block font-extrabold text-2xl tracking-wide bg-gradient-to-r from-instagram-gradientStart via-instagram-gradientMiddle to-instagram-gradientEnd bg-clip-text text-transparent cursor-pointer font-sans"
          >
            GMinsta
          </h1>
          <div
            onClick={() => navigate('/')}
            className="xl:hidden w-10 h-10 rounded-xl bg-gradient-to-tr from-instagram-gradientStart via-instagram-gradientMiddle to-instagram-gradientEnd flex items-center justify-center cursor-pointer shadow-md shadow-instagram-gradientMiddle/20"
          >
            <span className="text-white font-extrabold text-xl">G</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            
            const linkContent = (isActive = false) => (
              <div
                className={`flex items-center justify-center xl:justify-start space-x-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-premium-darkCard text-instagram-blue font-semibold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-premium-darkCard hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  {item.isAvatar ? (
                    <img
                      src={user?.profilePic || '/uploads/default-avatar.png'}
                      alt="avatar"
                      className={`w-7 h-7 rounded-full object-cover border-2 ${
                        isActive ? 'border-instagram-blue' : 'border-transparent'
                      }`}
                    />
                  ) : (
                    <Icon size={24} className="stroke-[2px]" />
                  )}
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-instagram-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse border-2 border-white dark:border-premium-darkBg">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="hidden xl:inline text-[15px]">{item.name}</span>
              </div>
            );

            if (item.action) {
              return (
                <div key={item.name} onClick={item.action}>
                  {linkContent(item.name === 'Search' && isSearchOpen)}
                </div>
              );
            }

            return (
              <NavLink key={item.name} to={item.path} className={({ isActive }) => 'block'}>
                {({ isActive }) => linkContent(isActive)}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="space-y-2 border-t border-premium-lightBorder dark:border-premium-darkBorder pt-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center xl:justify-start space-x-4 w-full px-4 py-3 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-premium-darkCard hover:text-neutral-900 dark:hover:text-white transition-all duration-300"
          >
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
            <span className="hidden xl:inline text-[15px]">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center justify-center xl:justify-start space-x-4 w-full px-4 py-3 rounded-xl text-instagram-red hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300"
          >
            <LogOut size={24} />
            <span className="hidden xl:inline text-[15px] font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Sliding Search Panel Drawer */}
      <div
        className={`fixed top-0 left-0 h-screen w-80 bg-white dark:bg-premium-darkBg border-r border-premium-lightBorder dark:border-premium-darkBorder z-30 transition-all duration-300 ease-in-out py-6 px-4 shadow-2xl ${
          isSearchOpen ? 'translate-x-20 xl:translate-x-60' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Search</h2>
          <button
            onClick={() => setIsSearchOpen(false)}
            className="rounded-full p-1.5 hover:bg-neutral-100 dark:hover:bg-premium-darkBorder text-neutral-500 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkCard text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
          />
          {isSearching ? (
            <Loader2 size={16} className="absolute right-3 top-3 animate-spin text-neutral-400" />
          ) : (
            searchQuery && (
              <X
                size={16}
                className="absolute right-3 top-3 cursor-pointer text-neutral-400 hover:text-neutral-600"
                onClick={() => setSearchQuery('')}
              />
            )
          )}
        </div>

        {/* Search Results */}
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-180px)] scrollbar-none">
          {searchResults.map((searchUser) => (
            <div
              key={searchUser._id}
              onClick={() => {
                navigate(`/profile/${searchUser.username}`);
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-premium-darkCard cursor-pointer transition"
            >
              <img
                src={searchUser.profilePic || '/uploads/default-avatar.png'}
                alt={searchUser.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
                    {searchUser.username}
                  </span>
                  {searchUser.isVerified && (
                    <span className="w-3.5 h-3.5 rounded-full bg-instagram-blue flex items-center justify-center text-[8px] text-white font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">{searchUser.fullname}</p>
              </div>
            </div>
          ))}

          {searchQuery && searchResults.length === 0 && !isSearching && (
            <p className="text-sm text-neutral-500 text-center py-4">No users found.</p>
          )}

          {!searchQuery && (
            <p className="text-xs text-neutral-400 text-center py-8">Type username or full name above</p>
          )}
        </div>
      </div>

      {/* Reusable Create Post Flow Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Post">
        <CreatePostFlow onSuccess={() => setIsCreateOpen(false)} />
      </Modal>
    </>
  );
};

export default Sidebar;
