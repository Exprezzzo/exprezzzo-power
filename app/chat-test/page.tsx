'use client';

import { useState } from 'react';
import ChatLayout from '../components/chat/ChatLayout';
import { BottomNavigation } from '../components/navigation/BottomNav';

export default function ChatTestPage() {
  const [activeTab, setActiveTab] = useState('chat');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    console.log('Active tab changed to:', tabId);
  };

  return (
    <div className="bg-black text-white relative">
      {/* Main Content */}
      <div className="pb-16 md:pb-0">
        <ChatLayout />
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}