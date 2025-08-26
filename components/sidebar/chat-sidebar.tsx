'use client';

import { useState } from 'react';
import { MessageSquare, Plus, Trash2, ChevronRight } from 'lucide-react';
import { useChatStore } from '@/lib/stores/chat-store';

export default function ChatSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { 
    conversations, 
    activeConversationId, 
    createConversation, 
    setActiveConversation, 
    deleteConversation 
  } = useChatStore();

  if (isCollapsed) {
    return (
      <div className="w-16 bg-gray-900 border-r border-white/10 p-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-900 border-r border-white/10 flex flex-col">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white">EXPREZZZO POWER</h2>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <button
          onClick={createConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {Object.values(conversations).map((conv) => (
          <div
            key={conv.id}
            onClick={() => setActiveConversation(conv.id)}
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer group ${
              activeConversationId === conv.id ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2 flex-1">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300 truncate">{conv.title}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteConversation(conv.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}