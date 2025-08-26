'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, Send, Settings, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatSwipe } from '../hooks/useSwipeGesture';
import { useKeyboardState } from '../hooks/useKeyboardHeight';
import { MobileSidebar } from '../components/chat/MobileSidebar';
import { ModelSelector } from '../components/chat/ModelSelector';
import { SwipableMessageList } from '../components/chat/SwipableMessage';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function MobileChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo-2024-04-09');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard handling
  const { keyboardHeight, isKeyboardOpen } = useKeyboardState();

  // Auto-scroll to bottom when keyboard opens or messages change
  useEffect(() => {
    if (isKeyboardOpen || messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isKeyboardOpen, messages.length]);

  // Swipe handlers for sidebar
  const swipeHandlers = useChatSwipe(
    undefined, // onSwipeLeft
    () => isMobile && setShowSidebar(true) // onSwipeRight
  );

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // Hide keyboard after send on mobile
    if (isMobile) {
      inputRef.current?.blur();
    }
    
    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: `I received your message: "${userMessage.content}". This is a simulated response from the ${selectedModel} model. The EXPREZZZO AI playground is working perfectly with mobile-optimized swipe gestures and keyboard handling.`,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = () => {
    // Prevent iOS zoom
    if (inputRef.current) {
      inputRef.current.style.fontSize = '16px';
    }
  };

  return (
    <div className="chat-app" {...swipeHandlers}>
      {/* Global styles for mobile viewport */}
      <style jsx global>{`
        html { 
          height: 100dvh; 
          height: -webkit-fill-available; 
        }
        body { 
          height: 100%; 
          margin: 0; 
          background: var(--vegas-black);
        }
      `}</style>

      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onSelectChat={(chatId) => {
          console.log('Selected chat:', chatId);
          setShowSidebar(false);
        }}
        onNewChat={() => {
          setMessages([]);
          setShowSidebar(false);
        }}
      />

      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="sidebar-area">
        {/* Conversation list would go here for desktop */}
        <div className="p-4 text-white">
          <h2 className="text-lg font-semibold mb-4">Conversations</h2>
          <div className="text-gray-400 text-sm">Desktop sidebar content</div>
        </div>
      </aside>

      {/* Header */}
      <header 
        className="header-area flex items-center justify-between px-4 py-3 safe-top"
      >
        <button
          onClick={() => setShowSidebar(true)}
          className="p-2 -ml-2 hover:bg-gray-800 rounded-lg md:hidden touch-feedback text-white"
        >
          <Menu size={20} />
        </button>
        
        <ModelSelector 
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
        />
        
        <button className="p-2 -mr-2 hover:bg-gray-800 rounded-lg touch-feedback text-white">
          <Settings size={20} />
        </button>
      </header>

      {/* Messages Area */}
      <main 
        className="messages-container"
        style={{ 
          paddingBottom: isKeyboardOpen ? `${Math.max(keyboardHeight, 20)}px` : '1rem' 
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-vegas-gold-gradient flex items-center justify-center mb-6">
              <Brain className="w-8 h-8 text-black" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome to EXPREZZZO
            </h2>
            <p className="text-gray-400 max-w-md">
              Start a conversation with AI. Swipe right to access your chat history, 
              or swipe left on messages to delete them.
            </p>
          </div>
        ) : (
          <>
            <SwipableMessageList 
              messages={messages}
              onDeleteMessage={handleDeleteMessage}
            />
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="message assistant">
                <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex gap-1">
                    {[0, 150, 300].map(delay => (
                      <span 
                        key={delay}
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" 
                        style={{ animationDelay: `${delay}ms` }} 
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400 ml-2">
                    {selectedModel.includes('gpt-4') ? 'GPT-4' : 'Claude'} is thinking...
                  </span>
                </div>
              </div>
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} className="h-1" />
          </>
        )}
      </main>

      {/* Input Area */}
      <div 
        className="input-area safe-bottom"
        style={{ 
          paddingBottom: `max(16px, env(safe-area-inset-bottom), ${keyboardHeight}px)`
        }}
      >
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={handleInputFocus}
            placeholder="Type your message..."
            className="flex-1 min-h-[44px] max-h-32 px-4 py-3 rounded-2xl border border-gray-700 
                       resize-none text-[16px] leading-5 bg-gray-800 text-white placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                       touch-input ios-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all",
              "touch-feedback active:scale-95",
              inputValue.trim() && !isLoading
                ? "bg-vegas-gold-gradient text-black shadow-lg" 
                : "bg-gray-700 text-gray-400"
            )}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}