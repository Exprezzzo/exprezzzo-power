'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Send, Loader2, Sparkles, Zap, Brain, Code2, Mic, Paperclip, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AI_MODELS_2025 } from '@/lib/ai-models-2025';
import { useChatStore } from '@/lib/stores/chat-store';

// Dynamic import the sidebar to avoid SSR issues
const ChatSidebar = dynamic(() => import('@/components/sidebar/chat-sidebar'), {
  ssr: false,
  loading: () => <div className="w-80 bg-gray-900 animate-pulse" />
});

export default function PlaygroundPage() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo-2024-04-09');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get chat store functions
  const { 
    activeConversationId,
    conversations,
    addMessage,
    createConversation,
    setActiveConversation
  } = useChatStore();

  // Get active conversation
  const activeConversation = conversations[activeConversationId || ''];
  const messages = activeConversation?.messages || [];

  // Create initial conversation if none exists
  useEffect(() => {
    if (!activeConversationId) {
      const id = createConversation();
      setActiveConversation(id);
    }
  }, [activeConversationId, createConversation, setActiveConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !activeConversationId) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    // Add user message to store
    addMessage(activeConversationId, {
      role: 'user',
      content: userMessage,
      model: selectedModel,
      timestamp: Date.now()
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          model: selectedModel,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantMessage += data.content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Add assistant message to store
      addMessage(activeConversationId, {
        role: 'assistant',
        content: assistantMessage,
        model: selectedModel,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Chat error:', error);
      addMessage(activeConversationId, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        model: selectedModel,
        timestamp: Date.now()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <ChatSidebar />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-900/50 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl font-bold text-white">AI Playground</h1>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                {activeConversation?.title || 'New Chat'}
              </span>
            </div>
            
            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              {Object.entries(AI_MODELS_2025).map(([id, model]) => (
                <option key={id} value={id} className="bg-gray-800">
                  {model.name} • {model.speed}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Sparkles className="w-16 h-16 mb-4 text-purple-500/30" />
              <h2 className="text-2xl font-bold mb-2">Start a Conversation</h2>
              <p className="text-gray-500">Choose a model and send your first message</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                        : 'bg-gray-800/50 border border-white/10 text-gray-100'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs opacity-60">
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        {msg.model && (
                          <>
                            <span>•</span>
                            <span>{AI_MODELS_2025[msg.model]?.name || msg.model}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">U</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="bg-gray-800/50 border border-white/10 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 bg-gray-900/50 backdrop-blur-xl px-6 py-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <button
                type="button"
                className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                title="Attach files"
              >
                <Paperclip className="w-5 h-5 text-gray-400" />
              </button>
              
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                disabled={isLoading}
              />
              
              <button
                type="button"
                className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                title="Voice input"
              >
                <Mic className="w-5 h-5 text-gray-400" />
              </button>
              
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}