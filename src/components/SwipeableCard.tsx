import React, { useRef, useState } from 'react';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: React.ReactNode;
    color: string;
    label: string;
  };
  rightAction?: {
    icon: React.ReactNode;
    color: string;
    label: string;
  };
}

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction
}: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useSwipeGesture(cardRef, {
    onSwipeLeft: () => {
      if (onSwipeLeft) {
        setIsTransitioning(true);
        setOffset(-100);
        setTimeout(() => {
          onSwipeLeft();
          setOffset(0);
          setIsTransitioning(false);
        }, 300);
      }
    },
    onSwipeRight: () => {
      if (onSwipeRight) {
        setIsTransitioning(true);
        setOffset(100);
        setTimeout(() => {
          onSwipeRight();
          setOffset(0);
          setIsTransitioning(false);
        }, 300);
      }
    },
    threshold: 75
  });

  return (
    <div className="relative overflow-hidden">
      {/* Background actions */}
      {leftAction && (
        <div className={`absolute inset-y-0 left-0 w-20 ${leftAction.color} flex items-center justify-center`}>
          <div className="text-white text-center">
            {leftAction.icon}
            <p className="text-xs mt-1">{leftAction.label}</p>
          </div>
        </div>
      )}
      
      {rightAction && (
        <div className={`absolute inset-y-0 right-0 w-20 ${rightAction.color} flex items-center justify-center`}>
          <div className="text-white text-center">
            {rightAction.icon}
            <p className="text-xs mt-1">{rightAction.label}</p>
          </div>
        </div>
      )}
      
      {/* Swipeable content */}
      <div
        ref={cardRef}
        className={`relative bg-[rgb(var(--bg-primary))] ${isTransitioning ? 'transition-transform duration-300' : ''}`}
        style={{
          transform: `translateX(${offset}%)`,
          opacity: Math.abs(offset) > 50 ? 0.5 : 1
        }}
      >
        {children}
      </div>
    </div>
  );
}