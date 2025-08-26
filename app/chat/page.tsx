'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, Send, X, Brain, MessageSquare } from 'lucide-react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('groq');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchEndX - touchStartX > 100 && touchStartX < 50) {
        setIsSidebarOpen(true);
      }
      if (touchStartX - touchEndX > 100) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage.content,
          provider: selectedModel,
          maxTokens: 500
        })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'No response received'
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className={`fixed md:relative w-72 h-full bg-gray-900 border-r border-yellow-600 border-opacity-20 transform transition-transform duration-300 z-50 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-4 border-b border-yellow-600 border-opacity-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-yellow-500">EXPREZZZO</h2>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold py-3 px-4 rounded-lg">
            New Chat
          </button>
        </div>
        <div className="p-4">
          <h3 className="text-sm text-gray-400 mb-3">Recent Chats</h3>
          <div className="space-y-2">
            <div className="p-3 hover:bg-gray-800 rounded-lg cursor-pointer">
              <MessageSquare className="w-4 h-4 text-gray-500 inline mr-2" />
              <span className="text-sm">Previous Chat</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-gray-900 bg-opacity-50 border-b border-yellow-600 border-opacity-20 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Brain className="w-6 h-6 text-yellow-500" />
              <h1 className="text-lg font-bold">AI Chat</h1>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-1 bg-gray-800 border border-yellow-600 border-opacity-20 rounded text-sm"
            >
              <option value="groq">Groq</option>
              <option value="openai">GPT-4</option>
              <option value="anthropic">Claude</option>
              <option value="gemini">Gemini</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Brain className="w-16 h-16 mb-4 text-yellow-600 opacity-30" />
              <h2 className="text-xl font-semibold mb-2">Start a Conversation</h2>
              <p className="text-sm">Choose a model and send your first message</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs md:max-w-2xl px-4 py-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-yellow-600 text-black' 
                    : 'bg-gray-800 border border-gray-700'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-yellow-600 border-opacity-20 p-4 bg-gray-900 bg-opacity-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400"
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-lg disabled:opacity-50"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}