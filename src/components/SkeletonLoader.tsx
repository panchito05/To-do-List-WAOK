import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'team' | 'feature' | 'text' | 'button';
  count?: number;
}

export default function SkeletonLoader({ variant = 'text', count = 1 }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'team':
        return (
          <div className="card p-6 space-y-4">
            <div className="skeleton h-8 w-48 rounded"></div>
            <div className="flex gap-2">
              <div className="skeleton h-10 w-10 rounded"></div>
              <div className="skeleton h-10 w-10 rounded"></div>
              <div className="skeleton h-10 w-10 rounded"></div>
            </div>
            <div className="skeleton h-12 w-full rounded"></div>
            <div className="space-y-3">
              <div className="skeleton h-20 w-full rounded"></div>
              <div className="skeleton h-20 w-full rounded"></div>
              <div className="skeleton h-20 w-full rounded"></div>
            </div>
          </div>
        );
        
      case 'feature':
        return (
          <div className="bg-[rgb(var(--bg-primary))] rounded-lg p-4 space-y-3 border border-[rgb(var(--border-primary))]">
            <div className="flex items-center gap-3">
              <div className="skeleton h-6 w-10 rounded"></div>
              <div className="skeleton h-6 w-48 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="skeleton h-4 w-full rounded"></div>
              <div className="skeleton h-4 w-3/4 rounded"></div>
            </div>
          </div>
        );
        
      case 'button':
        return (
          <div className="skeleton h-11 w-32 rounded-lg"></div>
        );
        
      default:
        return (
          <div className="skeleton h-4 w-full rounded"></div>
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
}