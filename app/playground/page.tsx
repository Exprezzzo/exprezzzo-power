'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Brain, MessageSquare, Plus, Trash2, ChevronRight } from 'lucide-react';

// Everything embedded to avoid import failures
const AI_MODELS = {
  'gpt-4-turbo-2024-04-09': { name: 'GPT-4 Turbo', speed: 'Fast' },
  'gpt-4o-mini': { name: 'GPT-4o Mini', speed: 'Very Fast' },
  'claude-3-5-sonnet-20241022': { name: 'Claude 3.5 Sonnet', speed: 'Fast' },
  'gemini-2.0-flash-exp': { name: 'Gemini 2.0 Flash', speed: 'Lightning' },
  'llama-3.1-70b-versatile': { name: 'Llama 3.1 70B', speed: 'Ultra Fast' }
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  model?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export default function PlaygroundPage() {
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo-2024-04-09');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Initialize on mount only (prevent SSR issues)
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('exp-chats');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setConversations(data.conversations || {});
        setActiveId(data.activeId || null);
      } catch (e) {
        console.error('Failed to load:', e);
      }
    }
    
    // Create first conversation if empty
    if (!stored || Object.keys(JSON.parse(stored).conversations || {}).length === 0) {
      const id = 'chat-' + Date.now();
      const newChat: Conversation = {
        id,
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setConversations({ [id]: newChat });
      setActiveId(id);
    }
  }, []);

  // Save on changes
  useEffect(() => {
    if (mounted && Object.keys(conversations).length > 0) {
      localStorage.setItem('exp-chats', JSON.stringify({
        conversations,
        activeId
      }));
    }
  }, [conversations, activeId, mounted]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  const createChat = () => {
    const id = 'chat-' + Date.now();
    const newChat: Conversation = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    setConversations(prev => ({ ...prev, [id]: newChat }));
    setActiveId(id);
  };

  const deleteChat = (id: string) => {
    setConversations(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    
    if (activeId === id) {
      const remaining = Object.keys(conversations).filter(k => k !== id);
      setActiveId(remaining[0] || null);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !activeId) return;

    const userMsg = message.trim();
    setMessage('');
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: userMsg,
      timestamp: Date.now(),
      model: selectedModel
    };

    setConversations(prev => ({
      ...prev,
      [activeId]: {
        ...prev[activeId],
        messages: [...prev[activeId].messages, userMessage],
        updatedAt: Date.now(),
        title: prev[activeId].messages.length === 0 ? userMsg.substring(0, 30) : prev[activeId].title
      }
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...conversations[activeId].messages, userMessage],
          model: selectedModel,
        }),
      });

      if (!response.ok) throw new Error('Failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) aiResponse += data.content;
            } catch {}
          }
        }
      }

      // Add AI response
      const aiMessage: Message = {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: aiResponse || 'Sorry, no response generated.',
        timestamp: Date.now(),
        model: selectedModel
      };

      setConversations(prev => ({
        ...prev,
        [activeId]: {
          ...prev[activeId],
          messages: [...prev[activeId].messages, aiMessage],
          updatedAt: Date.now()
        }
      }));

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: 'Error: Failed to connect. Please try again.',
        timestamp: Date.now(),
        model: selectedModel
      };

      setConversations(prev => ({
        ...prev,
        [activeId]: {
          ...prev[activeId],
          messages: [...prev[activeId].messages, errorMessage],
          updatedAt: Date.now()
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const current = conversations[activeId || ''];
  const messages = current?.messages || [];

  // Don't render until mounted (prevents hydration mismatch)
  if (!mounted) {
    return <div className="h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>;
  }

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-16'} bg-gray-900 border-r border-white/10 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <span className="font-bold text-white">EXPREZZZO</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        
        {sidebarOpen && (
          <>
            <div className="p-4">
              <button
                onClick={createChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {Object.keys(conversations).length === 0 ? (
                <p className="text-gray-500 text-sm text-center mt-4">No conversations yet</p>
              ) : (
                Object.values(conversations).map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setActiveId(conv.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer group mb-1 ${
                      activeId === conv.id ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300 truncate">{conv.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this chat?')) {
                          deleteChat(conv.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-900/50 backdrop-blur border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl font-bold text-white">AI Playground</h1>
              {current && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                  {current.title}
                </span>
              )}
            </div>
            
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              {Object.entries(AI_MODELS).map(([id, model]) => (
                <option key={id} value={id} className="bg-gray-900">
                  {model.name} • {model.speed}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Sparkles className="w-16 h-16 mb-4 text-purple-500/30" />
              <h2 className="text-2xl font-bold mb-2 text-white">Start a Conversation</h2>
              <p className="text-gray-500">Choose a model and send your first message</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                      : 'bg-gray-800/50 border border-white/10 text-gray-100'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-60 mt-2">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">U</span>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="bg-gray-800/50 border border-white/10 rounded-2xl px-4 py-3">
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
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-white/10 bg-gray-900/50 backdrop-blur px-6 py-4">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              disabled={isLoading}
            />
            
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}