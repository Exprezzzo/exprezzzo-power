'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import ConversationList from './ConversationList';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { MobileSidebar } from './MobileSidebar';

export default function ChatLayout() {
  const [isMobileView, setIsMobileView] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    console.log('Selected chat:', chatId);
  };

  const handleNewChat = () => {
    setSelectedChatId(null);
    console.log('Creating new chat');
  };

  return (
    <div className="chat-app">
      {/* Mobile Sidebar - Overlay on mobile */}
      <MobileSidebar 
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />
      
      {/* Desktop Sidebar - Grid area sidebar */}
      <aside className="sidebar-area">
        <ConversationList onSelectChat={handleSelectChat} />
      </aside>
      
      {/* Header area */}
      <header className="header-area">
        <ChatHeader onBackClick={handleNewChat} />
      </header>
      
      {/* Messages area */}
      <main className="messages-container">
        <MessageList />
      </main>
      
      {/* Input area */}
      <div className="input-area">
        <ChatInput />
      </div>
    </div>
  );
}