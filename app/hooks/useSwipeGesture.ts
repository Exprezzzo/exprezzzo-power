'use client';

import { useRef, useCallback, TouchEvent, MouseEvent } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefaultTouchmove?: boolean;
  trackMouse?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGesture(config: SwipeConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchmove = true,
    trackMouse = false
  } = config;

  const startPoint = useRef<TouchPoint | null>(null);
  const endPoint = useRef<TouchPoint | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startPoint.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    endPoint.current = null;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefaultTouchmove) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    endPoint.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }, [preventDefaultTouchmove]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!startPoint.current || !endPoint.current) return;

    const deltaX = endPoint.current.x - startPoint.current.x;
    const deltaY = endPoint.current.y - startPoint.current.y;
    const deltaTime = endPoint.current.time - startPoint.current.time;

    // Ignore very slow swipes (> 500ms)
    if (deltaTime > 500) return;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine swipe direction based on larger delta
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    // Reset points
    startPoint.current = null;
    endPoint.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  // Mouse support for desktop testing
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!trackMouse) return;
    
    startPoint.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
    endPoint.current = null;
  }, [trackMouse]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!trackMouse || !startPoint.current) return;
    
    endPoint.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
  }, [trackMouse]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!trackMouse) return;
    handleTouchEnd(e as any); // Reuse touch logic
  }, [trackMouse, handleTouchEnd]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    ...(trackMouse && {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp
    })
  };
}

// Specific hook for chat swipe interactions
export function useChatSwipe(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  return useSwipeGesture({
    onSwipeLeft,
    onSwipeRight,
    threshold: 50,
    preventDefaultTouchmove: true,
    trackMouse: false
  });
}

// Hook for message swipe-to-delete
export function useMessageSwipe(onDelete?: () => void) {
  return useSwipeGesture({
    onSwipeLeft: onDelete,
    threshold: 60,
    preventDefaultTouchmove: false, // Allow scrolling
    trackMouse: false
  });
}