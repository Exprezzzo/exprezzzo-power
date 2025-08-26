'use client';

import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { TouchButton } from '../ui/TouchButton';

interface ConversationListProps {
  onSelectChat: (chatId: string) => void;
}

export default function ConversationList({ onSelectChat }: ConversationListProps) {
  // Mock data - replace with actual state management
  const conversations = [
    { id: '1', title: 'AI Strategy Discussion', lastMessage: '2 hours ago' },
    { id: '2', title: 'Code Review Help', lastMessage: '1 day ago' },
    { id: '3', title: 'Marketing Ideas', lastMessage: '3 days ago' },
  ];

  return (
    <div className="h-full bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">Conversations</h2>
        <TouchButton 
          onClick={() => console.log('New chat clicked')}
          variant="primary"
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </TouchButton>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelectChat(conv.id)}
            className="flex items-center justify-between p-4 hover:bg-gray-800 cursor-pointer border-b border-gray-800/50 group"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {conv.title}
                </p>
                <p className="text-xs text-gray-400">{conv.lastMessage}</p>
              </div>
            </div>
            <TouchButton
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this chat?')) {
                  console.log('Delete chat:', conv.id);
                }
              }}
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 small-button hover:bg-red-500/20 text-red-400"
              style={{ minHeight: '32px', minWidth: '32px', padding: '4px' }}
            >
              <Trash2 className="w-3 h-3" />
            </TouchButton>
          </div>
        ))}
      </div>
    </div>
  );
}