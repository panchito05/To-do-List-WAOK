import { useEffect, useRef, useState } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefault?: boolean;
}

export function useSwipeGesture(
  elementRef: React.RefObject<HTMLElement>,
  config: SwipeConfig
) {
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const startTime = useRef(0);

  const minSwipeDistance = config.threshold || 50;
  const maxSwipeTime = 500; // Max time for a swipe gesture in ms

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      startTime.current = Date.now();
      setIsSwiping(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return;
      
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;
      
      if (config.preventDefault) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (!isSwiping) return;
      
      const swipeTime = Date.now() - startTime.current;
      if (swipeTime > maxSwipeTime) {
        setIsSwiping(false);
        return;
      }

      const deltaX = touchEndX.current - touchStartX.current;
      const deltaY = touchEndY.current - touchStartY.current;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY && absX > minSwipeDistance) {
        // Horizontal swipe
        if (deltaX > 0) {
          config.onSwipeRight?.();
        } else {
          config.onSwipeLeft?.();
        }
      } else if (absY > absX && absY > minSwipeDistance) {
        // Vertical swipe
        if (deltaY > 0) {
          config.onSwipeDown?.();
        } else {
          config.onSwipeUp?.();
        }
      }

      setIsSwiping(false);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: !config.preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !config.preventDefault });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, config, isSwiping, minSwipeDistance]);

  return { isSwiping };
}