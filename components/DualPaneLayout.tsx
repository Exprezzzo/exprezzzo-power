// components/DualPaneLayout.tsx
// Canvas/Artifacts-style dual pane layout with resizable panels

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DualPaneLayoutProps } from '@/types/ai-playground';

const DualPaneLayout: React.FC<DualPaneLayoutProps> = ({
  leftPane,
  rightPane,
  initialSplit = 50,
  minSize = 300,
  maxSize = 80,
  onSplitChange,
  className = ''
}) => {
  const [split, setSplit] = useState(initialSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);

  // Handle mouse/touch events for resizing
  const startResize = useCallback((clientX: number) => {
    setIsDragging(true);
    
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      
      const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const relativeX = currentX - containerRect.left;
      const newSplit = Math.max(
        (minSize / containerWidth) * 100,
        Math.min((maxSize / 100) * 100, (relativeX / containerWidth) * 100)
      );
      
      setSplit(newSplit);
      onSplitChange?.(newSplit);
    };

    const handleEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  }, [minSize, maxSize, onSplitChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startResize(e.clientX);
  }, [startResize]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    startResize(e.touches[0].clientX);
  }, [startResize]);

  // Keyboard shortcuts for quick split adjustments
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setSplit(25);
            onSplitChange?.(25);
            break;
          case '2':
            e.preventDefault();
            setSplit(50);
            onSplitChange?.(50);
            break;
          case '3':
            e.preventDefault();
            setSplit(75);
            onSplitChange?.(75);
            break;
          case '[':
            e.preventDefault();
            setSplit(Math.max((minSize / (containerRef.current?.offsetWidth || 1000)) * 100, split - 10));
            break;
          case ']':
            e.preventDefault();
            setSplit(Math.min((maxSize / 100) * 100, split + 10));
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [split, minSize, maxSize, onSplitChange]);

  const leftStyle = {
    width: `${split}%`,
    minWidth: `${minSize}px`,
  };

  const rightStyle = {
    width: `${100 - split}%`,
    minWidth: `${minSize}px`,
  };

  return (
    <div 
      ref={containerRef}
      className={`flex h-full w-full relative ${className}`}
      style={{ cursor: isDragging ? 'col-resize' : 'default' }}
    >
      {/* Left Pane */}
      <div 
        className="flex-shrink-0 overflow-hidden"
        style={leftStyle}
      >
        <div className="h-full w-full">
          {leftPane}
        </div>
      </div>

      {/* Resizer */}
      <div
        ref={resizerRef}
        className={`
          flex-shrink-0 w-1 bg-gradient-to-b from-transparent via-white/20 to-transparent
          hover:bg-gradient-to-b hover:from-transparent hover:via-[#FFD700]/40 hover:to-transparent
          cursor-col-resize relative group z-10 transition-all duration-200
          ${isDragging ? 'bg-gradient-to-b from-transparent via-[#FFD700]/60 to-transparent' : ''}
        `}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Resizer Handle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className={`
            w-1 h-12 bg-white/30 rounded-full
            group-hover:bg-[#FFD700]/60 group-hover:h-16
            transition-all duration-200
            ${isDragging ? 'bg-[#FFD700]/80 h-20' : ''}
          `}>
            {/* Grip dots */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 space-y-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`
                    w-0.5 h-0.5 bg-white/50 rounded-full
                    group-hover:bg-[#FFD700]/80
                    ${isDragging ? 'bg-[#FFD700]' : ''}
                  `}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Touch target (larger for mobile) */}
        <div className="absolute inset-0 w-4 -ml-1.5 md:w-2 md:-ml-0.5" />
      </div>

      {/* Right Pane */}
      <div 
        className="flex-shrink-0 overflow-hidden"
        style={rightStyle}
      >
        <div className="h-full w-full">
          {rightPane}
        </div>
      </div>

      {/* Split ratio indicator (shown during drag) */}
      {isDragging && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black/80 text-[#FFD700] px-3 py-1 rounded-full text-xs font-mono backdrop-blur-sm">
            {Math.round(split)}% : {Math.round(100 - split)}%
          </div>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      {isDragging && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black/80 text-white/70 px-3 py-2 rounded-lg text-xs backdrop-blur-sm">
            <div className="text-center space-y-1">
              <div>⌘1/2/3 Quick splits</div>
              <div>⌘[/] Adjust by 10%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DualPaneLayout;