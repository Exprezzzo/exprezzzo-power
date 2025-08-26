'use client';

import { useState, useEffect } from 'react';

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Modern Virtual Keyboard API (Chrome 94+, Safari 15+)
    if ('virtualKeyboard' in navigator) {
      const virtualKeyboard = (navigator as any).virtualKeyboard;
      virtualKeyboard.overlaysContent = true;
      
      const handleGeometryChange = (event: any) => {
        const { height } = event.target.boundingRect;
        setKeyboardHeight(height);
        
        // Auto-scroll to latest message when keyboard opens
        if (height > 0) {
          setTimeout(() => {
            const messagesEnd = document.getElementById('messages-end');
            messagesEnd?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      };
      
      virtualKeyboard.addEventListener('geometrychange', handleGeometryChange);
      
      return () => {
        virtualKeyboard.removeEventListener('geometrychange', handleGeometryChange);
      };
    }

    // Fallback: Visual Viewport API (iOS Safari, Chrome)
    if ('visualViewport' in window && window.visualViewport) {
      const viewport = window.visualViewport;
      const initialHeight = window.innerHeight;

      const handleViewportChange = () => {
        const currentHeight = viewport.height;
        const heightDifference = initialHeight - currentHeight;
        
        // Only consider significant height changes as keyboard
        if (heightDifference > 100) {
          setKeyboardHeight(heightDifference);
        } else {
          setKeyboardHeight(0);
        }
      };

      viewport.addEventListener('resize', handleViewportChange);
      
      return () => {
        viewport.removeEventListener('resize', handleViewportChange);
      };
    }

    // Last resort: window resize (less reliable)
    const initialHeight = window.innerHeight;
    
    const handleWindowResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      
      if (heightDifference > 100) {
        setKeyboardHeight(heightDifference);
      } else {
        setKeyboardHeight(0);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  return keyboardHeight;
}

// Enhanced hook with keyboard state
export function useKeyboardState() {
  const keyboardHeight = useKeyboardHeight();
  const isKeyboardOpen = keyboardHeight > 0;
  
  return {
    keyboardHeight,
    isKeyboardOpen,
    keyboardOffset: Math.max(16, keyboardHeight)
  };
}