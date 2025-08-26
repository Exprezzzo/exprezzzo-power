'use client';

import React, { useEffect, useState } from 'react';
import { X, Plus, MessageCircle, Shield, Users, TrendingDown, DollarSign } from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  totalSavings?: number;
  className?: string;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

function useSwipeToClose(onClose: () => void, threshold: number = 100): SwipeHandlers {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isMoving, setIsMoving] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    setIsMoving(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMoving) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMoving) return;
    
    const deltaX = currentX - startX;
    
    // Swipe left to close
    if (deltaX < -threshold) {
      onClose();
    }
    
    setIsMoving(false);
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

export function MobileSidebar({ 
  isOpen, 
  onClose, 
  onNewChat, 
  onSelectChat,
  totalSavings = 0,
  className = ''
}: MobileSidebarProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const swipeHandlers = useSwipeToClose(onClose);

  // Handle animation state
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleNewChat = () => {
    onNewChat?.();
    handleClose();
  };

  const handleSelectChat = (chatId: string) => {
    onSelectChat?.(chatId);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 md:hidden ${className}`}>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-gray-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-x-0' : '-translate-x-full'
        }`}
        {...swipeHandlers}
      >
        {/* Header with Robin Hood branding */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">EXPREZZZO</h2>
                <p className="text-sm text-amber-400">Robin Hood AI</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Community Impact Stats */}
          <div className="bg-gradient-to-r from-amber-400/10 to-yellow-600/10 rounded-lg p-4 border border-amber-400/20">
            <h3 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Community Impact
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300">Your Savings</span>
                <span className="text-sm font-bold text-amber-400">${totalSavings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300">Community Saved</span>
                <span className="text-sm font-bold text-green-400">$12,847</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300">Active Users</span>
                <span className="text-sm font-bold text-blue-400">2,341</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Recent Chats
          </h3>
          <div className="space-y-2">
            {[
              { id: '1', title: 'Code optimization tips', date: '2 hours ago' },
              { id: '2', title: 'Business strategy advice', date: '1 day ago' },
              { id: '3', title: 'Creative writing help', date: '3 days ago' },
              { id: '4', title: 'Data analysis query', date: '1 week ago' }
            ].map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className="w-full p-3 text-left rounded-lg border border-gray-700 hover:border-amber-400/30 hover:bg-amber-400/5 transition-all group min-h-[60px]"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-amber-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white group-hover:text-amber-200 truncate">
                      {chat.title}
                    </p>
                    <p className="text-xs text-gray-500">{chat.date}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Empty State */}
          {false && (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No chats yet</p>
              <p className="text-gray-600 text-xs">Start a conversation to get going</p>
            </div>
          )}
        </div>
        
        {/* New Chat Button */}
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-amber-400 to-yellow-600 text-black font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:from-amber-500 hover:to-yellow-700 transition-all shadow-lg min-h-[44px]"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
          
          {/* Robin Hood Mission Statement */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Democratizing AI • 40% cheaper than direct access
            </p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">Community</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-amber-400">Savings</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-blue-400">Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}