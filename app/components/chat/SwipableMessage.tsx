'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash2, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMessageSwipe } from '../../hooks/useSwipeGesture';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface SwipableMessageProps {
  message: Message;
  onDelete?: (messageId: string) => void;
  className?: string;
}

export function SwipableMessage({ message, onDelete, className }: SwipableMessageProps) {
  const [swiped, setSwiped] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const messageRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === 'user';
  
  const handleDelete = () => {
    setSwiped(true);
    setTimeout(() => {
      onDelete?.(message.id);
    }, 200);
  };

  const swipeHandlers = useMessageSwipe(handleDelete);

  // Enhanced swipe with visual feedback
  const handleTouchStart = (e: React.TouchEvent) => {
    swipeHandlers.onTouchStart(e);
    setSwipeOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    swipeHandlers.onTouchMove(e);
    
    // Visual feedback during swipe
    const touch = e.touches[0];
    const rect = messageRef.current?.getBoundingClientRect();
    if (rect) {
      const deltaX = touch.clientX - rect.left;
      const offset = Math.max(-80, Math.min(0, deltaX - rect.width / 2));
      setSwipeOffset(offset);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    swipeHandlers.onTouchEnd(e);
    setSwipeOffset(0);
  };

  return (
    <div 
      ref={messageRef}
      className={cn(
        "group relative transition-all duration-300 ease-out",
        swiped && "opacity-0 scale-95 translate-x-full",
        className
      )}
      style={{
        transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Delete indicator shown during swipe */}
      {swipeOffset < -20 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
          <div className="flex items-center justify-center w-8 h-8 bg-red-500 rounded-full">
            <Trash2 className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Message wrapper */}
      <div className={cn(
        "message transition-all duration-200",
        isUser ? "own" : "assistant"
      )}>
        {/* Message content */}
        <div className={cn(
          "flex gap-3 p-4 rounded-2xl",
          isUser 
            ? "bg-vegas-gold-gradient text-black" 
            : "glass-card text-white"
        )}>
          {/* Avatar */}
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            isUser 
              ? "bg-black/20" 
              : "bg-purple-500/20"
          )}>
            {isUser ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4 text-purple-400" />
            )}
          </div>

          {/* Message text */}
          <div className="flex-1 min-w-0">
            <div className={cn(
              "text-sm leading-relaxed break-words",
              isUser ? "text-black" : "text-white"
            )}>
              {message.content}
            </div>
            
            {/* Timestamp */}
            <div className={cn(
              "text-xs mt-1 opacity-60",
              isUser ? "text-black/60" : "text-white/60"
            )}>
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>

          {/* Desktop delete button (shown on hover) */}
          {onDelete && (
            <button
              onClick={handleDelete}
              className={cn(
                "hidden md:flex items-center justify-center w-6 h-6 rounded-full",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "hover:bg-red-500 hover:text-white text-gray-400"
              )}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile swipe instruction (subtle hint) */}
      {!swiped && swipeOffset === 0 && (
        <div className="md:hidden absolute -right-2 top-1/2 -translate-y-1/2 opacity-20">
          <div className="text-xs text-gray-500">
            ←
          </div>
        </div>
      )}
    </div>
  );
}

// Convenience wrapper for message lists
interface SwipableMessageListProps {
  messages: Message[];
  onDeleteMessage?: (messageId: string) => void;
  className?: string;
}

export function SwipableMessageList({ messages, onDeleteMessage, className }: SwipableMessageListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {messages.map((message) => (
        <SwipableMessage
          key={message.id}
          message={message}
          onDelete={onDeleteMessage}
        />
      ))}
    </div>
  );
}