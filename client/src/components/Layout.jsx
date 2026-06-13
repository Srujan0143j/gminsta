import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className="min-h-screen bg-premium-lightBg dark:bg-premium-darkBg text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="md:ml-20 xl:ml-60 min-h-screen pb-16 md:pb-0 flex flex-col transition-all duration-300">
        <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-6">
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav for Mobile */}
      <BottomNav />
    </div>
  );
};

export default Layout;
