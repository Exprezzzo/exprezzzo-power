'use client';

import { useState, useEffect } from 'react';
import { Menu, X, MessageSquare, Plus } from 'lucide-react';
import { TouchButton } from '../ui/TouchButton';

interface MobileSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectChat?: (chatId: string) => void;
  onNewChat?: () => void;
}

export function MobileSidebar({ isOpen: controlledIsOpen, onClose, onSelectChat, onNewChat }: MobileSidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Use controlled or internal state
  const isOpen = controlledIsOpen ?? internalIsOpen;
  
  // Mock conversations - replace with actual state management
  const [conversations] = useState([
    { id: '1', title: 'React Best Practices', date: '2 hours ago' },
    { id: '2', title: 'API Design Discussion', date: '1 day ago' },
    { id: '3', title: 'Mobile UI Components', date: '3 days ago' },
    { id: '4', title: 'TypeScript Tips', date: '1 week ago' }
  ]);

  // Handle body scroll lock when sidebar is open
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

  const openSidebar = () => {
    if (!controlledIsOpen) {
      setInternalIsOpen(true);
    }
    setIsAnimating(true);
  };

  const closeSidebar = () => {
    setIsAnimating(false);
    // Delay closing to allow exit animation
    setTimeout(() => {
      if (!controlledIsOpen) {
        setInternalIsOpen(false);
      }
      onClose?.();
    }, 300);
  };

  const handleConversationClick = (chatId: string) => {
    onSelectChat?.(chatId);
    closeSidebar();
  };

  const handleNewChat = () => {
    onNewChat?.();
    closeSidebar();
  };

  return (
    <>
      {/* Trigger Button - Only visible on mobile when not controlled */}
      {!controlledIsOpen && (
        <TouchButton
          onClick={openSidebar}
          variant="secondary"
          className="fixed top-4 left-4 p-3 bg-gray-900/90 backdrop-blur-sm border border-gray-700 shadow-lg md:hidden z-40 safe-top safe-left"
        >
          <Menu className="w-5 h-5 text-white" />
        </TouchButton>
      )}

      {/* Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
              isAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeSidebar}
          />
          
          {/* Sidebar Panel */}
          <div
            className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-gray-900 
                       shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
              isAnimating ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Conversations</h2>
              <TouchButton
                onClick={closeSidebar}
                variant="ghost"
                className="min-h-[36px] min-w-[36px] p-2"
              >
                <X className="w-5 h-5 text-gray-400" />
              </TouchButton>
            </div>
            
            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No conversations yet</p>
                  <p className="text-gray-600 text-xs mt-1">Start a new chat to get going</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <TouchButton
                    key={conv.id}
                    onClick={() => handleConversationClick(conv.id)}
                    variant="ghost"
                    className="w-full p-4 text-left hover:bg-gray-800 flex items-start gap-3 
                             border-b border-gray-800/50 rounded-none min-h-[60px]"
                  >
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white truncate">{conv.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{conv.date}</div>
                    </div>
                  </TouchButton>
                ))
              )}
            </div>
            
            {/* New Chat Button */}
            <div className="p-4 border-t border-gray-700">
              <TouchButton
                onClick={handleNewChat}
                variant="primary"
                className="w-full flex items-center justify-center gap-2 py-4"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">New Chat</span>
              </TouchButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}