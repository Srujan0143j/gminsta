import React from 'react';

export const StorySkeleton = () => (
  <div className="flex space-x-4 p-2 overflow-x-auto no-scrollbar">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex flex-col items-center space-y-1 min-w-[70px]">
        <div className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-premium-darkBorder animate-pulse" />
        <div className="w-12 h-3 bg-neutral-200 dark:bg-premium-darkBorder rounded animate-pulse" />
      </div>
    ))}
  </div>
);

export const PostSkeleton = () => (
  <div className="border border-premium-lightBorder dark:border-premium-darkBorder rounded-xl bg-white dark:bg-premium-darkCard p-4 w-full max-w-[480px] mx-auto space-y-4 shadow-sm">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-premium-darkBorder animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="w-24 h-4 bg-neutral-200 dark:bg-premium-darkBorder rounded animate-pulse" />
        <div className="w-16 h-3 bg-neutral-200 dark:bg-premium-darkBorder rounded animate-pulse" />
      </div>
    </div>
    <div className="w-full h-80 bg-neutral-200 dark:bg-premium-darkBorder rounded-lg animate-pulse" />
    <div className="space-y-2">
      <div className="flex space-x-3">
        <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-premium-darkBorder animate-pulse" />
        <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-premium-darkBorder animate-pulse" />
        <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-premium-darkBorder animate-pulse" />
      </div>
      <div className="w-20 h-4 bg-neutral-200 dark:bg-premium-darkBorder rounded animate-pulse" />
      <div className="w-full h-3 bg-neutral-200 dark:bg-premium-darkBorder rounded animate-pulse" />
      <div className="w-2/3 h-3 bg-neutral-200 dark:bg-premium-darkBorder rounded animate-pulse" />
    </div>
  </div>
);

export const ExploreSkeleton = () => (
  <div className="grid grid-cols-3 gap-1 md:gap-4 max-w-4xl mx-auto p-1">
    {[...Array(9)].map((_, i) => (
      <div key={i} className="aspect-square bg-neutral-200 dark:bg-premium-darkBorder rounded-md animate-pulse" />
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className="max-w-4xl mx-auto p-4 space-y-8">
    <div className="flex items-center space-x-8 md:space-x-16">
      <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-neutral-200 dark:bg-premium-darkBorder animate-pulse" />
      <div className="flex-1 space-y-4">
        <div className="w-32 h-6 bg-neutral-200 dark:bg-premium-darkBorder rounded animate-pulse" />
        <div className="flex space-x-4">
          <div className="w-16 h-4 bg-neutral-200 dark:bg-premium-darkBorder rounded animate-pulse" />
          <div className="w-16 h-4 bg-neutral-200 dark:bg-premium-darkBorder rounded animate-pulse" />
          <div className="w-16 h-4 bg-neutral-200 dark:bg-premium-darkBorder rounded animate-pulse" />
        </div>
        <div className="w-48 h-4 bg-neutral-200 dark:bg-premium-darkBorder rounded animate-pulse" />
      </div>
    </div>
    <hr className="border-premium-lightBorder dark:border-premium-darkBorder" />
    <div className="grid grid-cols-3 gap-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="aspect-square bg-neutral-200 dark:bg-premium-darkBorder rounded-md animate-pulse" />
      ))}
    </div>
  </div>
);
