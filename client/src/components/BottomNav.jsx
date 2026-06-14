import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Home, Search, Film, PlusSquare, User, MessageSquare } from 'lucide-react';
import Modal from './Modal';
import CreatePostFlow from './CreatePostFlow';

const BottomNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const activeClass = "text-instagram-blue scale-110 transition-all duration-300";
  const inactiveClass = "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-all duration-300";

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/85 dark:bg-premium-darkBg/85 backdrop-blur-md border-t border-premium-lightBorder dark:border-premium-darkBorder flex items-center justify-around px-2 z-40 transition-colors duration-300">
        <NavLink to="/" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <Home size={22} className="stroke-[2.5px]" />
        </NavLink>

        <NavLink to="/explore" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <Search size={22} className="stroke-[2.5px]" />
        </NavLink>

        <button
          onClick={() => setIsCreateOpen(true)}
          className={inactiveClass}
        >
          <PlusSquare size={22} className="stroke-[2.5px]" />
        </button>

        <NavLink to="/reels" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <Film size={22} className="stroke-[2.5px]" />
        </NavLink>

        <NavLink to={`/profile/${user?.username}`} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <img
            src={user?.profilePic || '/uploads/default-avatar.png'}
            alt="profile"
            className="w-6 h-6 rounded-full object-cover border border-premium-lightBorder dark:border-premium-darkBorder"
          />
        </NavLink>
      </div>

      {/* Reusable Create Post Flow Modal for mobile */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Post">
        <CreatePostFlow onSuccess={() => setIsCreateOpen(false)} />
      </Modal>
    </>
  );
};

export default BottomNav;
