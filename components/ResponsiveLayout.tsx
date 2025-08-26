'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, MoreVertical, Zap, Settings, Grid3X3, MessageSquare } from 'lucide-react';
import { VEGAS_THEME_COLORS } from '@/types/ai-playground';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidePanel?: React.ReactNode;
  modelSelector?: React.ReactNode;
  onModelSelect?: (modelId: string) => void;
  onRefresh?: () => Promise<void>;
  className?: string;
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

interface PullToRefreshState {
  pulling: boolean;
  distance: number;
  refreshing: boolean;
  triggered: boolean;
}

export default function ResponsiveLayout({
  children,
  sidePanel,
  modelSelector,
  onModelSelect,
  onRefresh,
  className = ''
}: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    direction: null
  });

  const [pullToRefreshState, setPullToRefreshState] = useState<PullToRefreshState>({
    pulling: false,
    distance: 0,
    refreshing: false,
    triggered: false
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const pullIndicatorRef = useRef<HTMLDivElement>(null);
  const refreshThreshold = 80;

  // Haptic feedback helper
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('navigator' in window && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Touch event handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isDragging: true,
      direction: null
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState.isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const deltaY = touch.clientY - swipeState.startY;
    
    // Determine swipe direction
    let direction: SwipeState['direction'] = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    setSwipeState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      direction
    }));

    // Handle pull-to-refresh
    if (direction === 'down' && window.scrollY === 0 && deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY, refreshThreshold * 1.5);
      
      setPullToRefreshState(prev => ({
        ...prev,
        pulling: true,
        distance,
        triggered: distance >= refreshThreshold
      }));

      if (distance >= refreshThreshold && !pullToRefreshState.triggered) {
        triggerHaptic('medium');
      }
    }

    // Handle sidebar swipe
    if (direction === 'right' && Math.abs(deltaX) > 50 && touch.clientX < 50) {
      setSidebarOpen(true);
      triggerHaptic('light');
    }
  }, [swipeState.isDragging, swipeState.startX, swipeState.startY, pullToRefreshState.triggered, triggerHaptic]);

  const handleTouchEnd = useCallback(async () => {
    const deltaX = swipeState.currentX - swipeState.startX;
    const deltaY = swipeState.currentY - swipeState.startY;

    // Handle swipe gestures
    if (Math.abs(deltaX) > 100 || Math.abs(deltaY) > 100) {
      if (swipeState.direction === 'left' && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Swipe left - close sidebar
        setSidebarOpen(false);
        triggerHaptic('light');
      } else if (swipeState.direction === 'right' && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Swipe right - open sidebar
        setSidebarOpen(true);
        triggerHaptic('light');
      }
    }

    // Handle pull-to-refresh
    if (pullToRefreshState.pulling) {
      if (pullToRefreshState.triggered && onRefresh) {
        setPullToRefreshState(prev => ({ ...prev, refreshing: true }));
        triggerHaptic('heavy');
        
        try {
          await onRefresh();
        } finally {
          setPullToRefreshState({
            pulling: false,
            distance: 0,
            refreshing: false,
            triggered: false
          });
        }
      } else {
        setPullToRefreshState({
          pulling: false,
          distance: 0,
          refreshing: false,
          triggered: false
        });
      }
    }

    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
      direction: null
    });
  }, [swipeState, pullToRefreshState, onRefresh, triggerHaptic]);

  // Handle model selection with haptic feedback
  const handleModelSelect = useCallback((modelId: string) => {
    triggerHaptic('medium');
    if (onModelSelect) {
      onModelSelect(modelId);
    }
    setShowBottomSheet(false);
  }, [onModelSelect, triggerHaptic]);

  // Pull-to-refresh indicator
  const refreshIndicator = (
    <div
      ref={pullIndicatorRef}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-300"
      style={{
        transform: `translateY(${pullToRefreshState.distance - 60}px)`,
        opacity: pullToRefreshState.pulling ? 1 : 0
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full border border-white/20"
        style={{
          background: pullToRefreshState.triggered 
            ? `linear-gradient(45deg, ${VEGAS_THEME_COLORS.primary}, ${VEGAS_THEME_COLORS.secondary})`
            : 'rgba(0, 0, 0, 0.8)'
        }}
      >
        <div
          className={`w-4 h-4 border-2 rounded-full transition-all duration-300 ${
            pullToRefreshState.refreshing ? 'animate-spin border-white border-t-transparent' :
            pullToRefreshState.triggered ? 'border-white' : 'border-white/50'
          }`}
        />
        <span className="text-sm font-medium text-white">
          {pullToRefreshState.refreshing ? 'Refreshing...' :
           pullToRefreshState.triggered ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
    </div>
  );

  // Bottom sheet for model selection
  const modelBottomSheet = (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        showBottomSheet ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setShowBottomSheet(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div
        className={`absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/20 rounded-t-2xl transition-transform duration-300 ${
          showBottomSheet ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">Select AI Model</h3>
          
          {modelSelector || (
            <div className="grid grid-cols-1 gap-3">
              {['gpt-4', 'claude-3-opus', 'gemini-pro'].map((model) => (
                <button
                  key={model}
                  onClick={() => handleModelSelect(model)}
                  className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 active:scale-[0.98]"
                  style={{ minHeight: '48px' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: VEGAS_THEME_COLORS.primary }}
                    />
                    <span className="font-medium text-white capitalize">
                      {model.replace('-', ' ')}
                    </span>
                  </div>
                  <ChevronDown className="w-5 h-5 text-white/50" />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Safe area padding for devices with home indicators */}
        <div className="h-6" />
      </div>
    </div>
  );

  // Mobile navigation
  const mobileNav = (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-t border-white/20">
      <div className="flex items-center justify-around py-2">
        <button
          onClick={() => setShowBottomSheet(true)}
          className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
          style={{ minHeight: '48px', minWidth: '48px' }}
        >
          <Zap size={20} color={VEGAS_THEME_COLORS.primary} />
          <span className="text-xs text-white/70">Models</span>
        </button>
        
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
          style={{ minHeight: '48px', minWidth: '48px' }}
        >
          <MessageSquare size={20} color="white" />
          <span className="text-xs text-white/70">Chats</span>
        </button>
        
        <button
          className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
          style={{ minHeight: '48px', minWidth: '48px' }}
        >
          <Grid3X3 size={20} color="white" />
          <span className="text-xs text-white/70">Apps</span>
        </button>
        
        <button
          className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
          style={{ minHeight: '48px', minWidth: '48px' }}
        >
          <Settings size={20} color="white" />
          <span className="text-xs text-white/70">Settings</span>
        </button>
      </div>
      
      {/* Safe area padding */}
      <div className="h-2" />
    </div>
  );

  // Sidebar overlay
  const sidebarOverlay = (
    <div
      className={`fixed inset-0 z-40 transition-all duration-300 ${
        sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setSidebarOpen(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div
        className={`absolute top-0 left-0 h-full w-80 max-w-[80vw] bg-black/90 backdrop-blur-xl border-r border-white/20 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {sidePanel}
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`relative min-h-screen ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {refreshIndicator}

      {/* Desktop layout */}
      {!isMobile && (
        <div className="flex h-screen">
          {/* Sidebar */}
          {sidePanel && (
            <div className="w-80 border-r border-white/20 bg-black/20 backdrop-blur-md">
              {sidePanel}
            </div>
          )}
          
          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </div>
      )}

      {/* Mobile layout */}
      {isMobile && (
        <>
          {/* Main content with padding for mobile nav */}
          <div className="min-h-screen pb-20">
            {children}
          </div>
          
          {/* Mobile navigation */}
          {mobileNav}
          
          {/* Model selector bottom sheet */}
          {modelBottomSheet}
          
          {/* Sidebar overlay */}
          {sidebarOverlay}
        </>
      )}

      {/* Status indicators */}
      <div className="fixed top-4 right-4 z-30 flex flex-col gap-2">
        {!navigator.onLine && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full text-red-400 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            Offline
          </div>
        )}
        
        {pullToRefreshState.refreshing && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 text-sm">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Refreshing
          </div>
        )}
      </div>

      {/* Loading overlay for page transitions */}
      <style jsx global>{`
        .page-transition {
          transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        }
        
        .page-transition-enter {
          opacity: 0;
          transform: translateX(20px);
        }
        
        .page-transition-enter-active {
          opacity: 1;
          transform: translateX(0);
        }
        
        .page-transition-exit {
          opacity: 1;
          transform: translateX(0);
        }
        
        .page-transition-exit-active {
          opacity: 0;
          transform: translateX(-20px);
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Native app-like momentum scrolling */
        * {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Prevent zoom on input focus (iOS Safari) */
        input, textarea, select {
          font-size: 16px;
        }
        
        /* Hide scrollbars but keep functionality */
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}