'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { SwipableMessageList } from './SwipableMessage';

export default function MessageList() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock messages - replace with actual state
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'user' as const,
      content: 'Hello! Can you help me understand React Server Components?',
      timestamp: new Date(Date.now() - 300000)
    },
    {
      id: '2',
      role: 'assistant' as const,
      content: 'Absolutely! React Server Components (RSCs) are a new paradigm that allows React components to be rendered on the server, reducing the JavaScript bundle sent to the client and improving performance. They run during build time or request time on the server, which means they have direct access to server-side resources like databases or file systems.',
      timestamp: new Date(Date.now() - 280000)
    }
  ]);

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    console.log('Deleted message:', messageId);
  };

  return (
    <div className="chat-messages overflow-y-auto bg-black" style={{ padding: 'var(--chat-padding)' }}>
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <Sparkles className="w-16 h-16 mb-4 text-purple-500/30" />
          <h2 className="text-2xl font-bold mb-2 text-white">Start a Conversation</h2>
          <p className="text-gray-500">Send your first message to get started</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <SwipableMessageList 
            messages={messages}
            onDeleteMessage={handleDeleteMessage}
          />
          
          {isLoading && (
            <div className="flex gap-4 mt-6">
              <div 
                className="rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
                style={{ width: 'var(--avatar-size)', height: 'var(--avatar-size)' }}
              >
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  {[0, 150, 300].map(delay => (
                    <span 
                      key={delay}
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
                      style={{ animationDelay: `${delay}ms` }} 
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Scroll anchor for keyboard auto-scroll */}
          <div id="messages-end" className="h-1" />
        </div>
      )}
    </div>
  );
}