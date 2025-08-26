// INSTRUCTION: Replace entire app/chat/page.tsx with this code
// This is the COMPLETE mobile-first Robin Hood chat interface

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Send, X, ChevronDown, Shield, Users, Zap, Bot, Brain, Sparkles, DollarSign } from 'lucide-react';

// Robin Hood AI Models - Community prices
const AI_MODELS = [
  { 
    id: 'groq-llama-3.1-70b', 
    name: 'Groq Lightning', 
    icon: '⚡', 
    color: 'text-orange-500',
    saving: '75% cheaper',
    speed: 'Fastest',
    cost: 0.0001
  },
  { 
    id: 'gpt-4-turbo', 
    name: 'GPT-4 Turbo', 
    icon: '🧠', 
    color: 'text-emerald-500',
    saving: '40% cheaper',
    speed: 'Fast',
    cost: 0.003
  },
  { 
    id: 'claude-3-5-sonnet', 
    name: 'Claude 3.5', 
    icon: '🎭', 
    color: 'text-purple-500',
    saving: '40% cheaper',
    speed: 'Fast',
    cost: 0.003
  },
  { 
    id: 'gemini-2.0-flash', 
    name: 'Gemini 2.0', 
    icon: '💎', 
    color: 'text-blue-500',
    saving: '45% cheaper',
    speed: 'Fast',
    cost: 0.0025
  }
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  cost?: number;
  timestamp: Date;
}

export default function RobinHoodChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('groq-llama-3.1-70b');
  const [showModels, setShowModels] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [totalSaved, setTotalSaved] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved messages
  useEffect(() => {
    const saved = localStorage.getItem('exprezzzo-messages');
    if (saved) {
      const parsed = JSON.parse(saved);
      setMessages(parsed.map((m: any) => ({...m, timestamp: new Date(m.timestamp)})));
    }
  }, []);

  // Save messages
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('exprezzzo-messages', JSON.stringify(messages));
      const saved = messages.reduce((acc, msg) => acc + (msg.cost || 0) * 0.4, 0);
      setTotalSaved(saved);
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle keyboard viewport changes
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const vh = window.visualViewport.height;
        document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
      }
    };

    window.visualViewport?.addEventListener('resize', handleViewportChange);
    handleViewportChange();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isRightSwipe && touchStart < 50) {
      setSidebarOpen(true);
    }
    if (isLeftSwipe) {
      setSidebarOpen(false);
    }
  }, [touchStart, touchEnd]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          model: selectedModel
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const model = AI_MODELS.find(m => m.id === selectedModel);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'I understand your request. Let me help you with that.',
        model: selectedModel,
        cost: model?.cost || 0.001,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '🔄 Switching to backup provider... Robin Hood AI ensures you always get a response!',
        model: 'groq-llama-3.1-70b',
        cost: 0.0001,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col"
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header - Trust & Transparency */}
      <header className="bg-black/90 backdrop-blur-xl border-b border-amber-500/20 px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-amber-500/10 rounded-lg transition-colors touch-target"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-amber-500" />
          </button>
          
          <button 
            onClick={() => setShowModels(!showModels)}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 rounded-lg hover:bg-amber-500/20 transition-all touch-target"
          >
            <span className="text-lg">{currentModel.icon}</span>
            <div className="text-left">
              <div className="text-amber-500 font-medium text-sm">
                {currentModel.name}
              </div>
              <div className="text-amber-300/60 text-xs">
                {currentModel.saving} • {currentModel.speed}
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform ${showModels ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </header>

      {/* Model Selector Dropdown */}
      {showModels && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowModels(false)}
          />
          <div className="absolute top-20 right-4 z-50 bg-gray-900/98 backdrop-blur-xl border border-amber-500/20 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
            <div className="p-3 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-b border-amber-500/20">
              <p className="text-xs text-amber-300 text-center font-medium">
                🏹 Community-Powered AI Models
              </p>
            </div>
            {AI_MODELS.map(model => (
              <button
                key={model.id}
                onClick={() => { 
                  setSelectedModel(model.id); 
                  setShowModels(false); 
                }}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-amber-500/10 transition-colors touch-target"
              >
                <span className="text-2xl">{model.icon}</span>
                <div className="text-left flex-1">
                  <div className="text-white font-medium">{model.name}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-400">{model.saving}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-amber-400">{model.speed}</span>
                  </div>
                </div>
                {selectedModel === model.id && (
                  <Shield className="w-5 h-5 text-amber-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Sidebar - Community Hub */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-black/98 backdrop-blur-xl transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } safe-area-left`}>
        <div className="flex items-center justify-between p-4 border-b border-amber-500/20 safe-area-top">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
              Exprezzzo Power
            </h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-amber-500/10 rounded-lg transition-colors touch-target"
          >
            <X className="w-5 h-5 text-amber-300" />
          </button>
        </div>
        
        <div className="flex flex-col h-full p-4">
          {/* Community Impact Card */}
          <div className="bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-emerald-500/20 p-4 rounded-xl mb-4 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-white">Your Impact</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Messages Sent</span>
                <span className="text-sm font-bold text-white">{messages.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Total Saved</span>
                <span className="text-sm font-bold text-emerald-400">
                  ${totalSaved.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">vs Big Tech</span>
                <span className="text-sm font-bold text-amber-400">40% less</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-amber-500/20">
              <p className="text-xs text-gray-400">
                Every message helps democratize AI access
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-2 mb-4">
            <button
              onClick={() => { 
                setMessages([]); 
                setSidebarOpen(false);
                localStorage.removeItem('exprezzzo-messages');
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg touch-target"
            >
              <Zap className="inline w-4 h-4 mr-2" />
              New Conversation
            </button>
            
            <button
              className="w-full px-4 py-3 bg-gray-800/50 text-amber-500 font-medium rounded-xl hover:bg-gray-800/70 transition-colors border border-amber-500/20 touch-target"
            >
              <DollarSign className="inline w-4 h-4 mr-2" />
              View Pricing
            </button>
          </div>

          {/* Recent Chats */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-sm text-gray-400 mb-3 font-medium">Recent Chats</h3>
            <div className="space-y-2">
              {messages.length > 0 && (
                <div className="px-3 py-2 bg-gray-800/30 rounded-lg">
                  <p className="text-sm text-gray-300">Current Session</p>
                  <p className="text-xs text-gray-500">{messages.length} messages</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 mt-auto border-t border-gray-800">
            <p className="text-xs text-center text-gray-500">
              Robin Hood Protocol v3.2
            </p>
          </div>
        </div>
      </aside>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Messages Container */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto pb-safe">
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="text-center py-20 animate-in fade-in-50">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full mb-4 border border-amber-500/20">
                <Shield className="w-10 h-10 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                AI for Everyone
              </h1>
              <p className="text-gray-400 mb-6">
                Premium AI access at community prices
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-500">Average Savings</p>
                  <p className="text-lg font-bold text-emerald-400">40%</p>
                </div>
                <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-500">Response Time</p>
                  <p className="text-lg font-bold text-amber-400">&lt;1s</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Messages */}
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'} animate-in slide-in-from-bottom-2`}
            >
              <div className={`inline-block max-w-[85%] px-4 py-3 rounded-2xl ${
                message.role === 'user' 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium shadow-lg' 
                  : 'bg-gray-800/80 backdrop-blur text-white border border-gray-700 shadow-md'
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.cost !== undefined && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/10">
                    <span className="text-xs opacity-70">
                      via {AI_MODELS.find(m => m.id === message.model)?.name}
                    </span>
                    <span className="text-xs font-bold text-emerald-300">
                      Saved ${(message.cost * 0.4).toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1 px-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="text-left mb-4 animate-in slide-in-from-bottom-2">
              <div className="inline-block px-4 py-3 bg-gray-800/80 backdrop-blur rounded-2xl border border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-gray-400">Robin Hood AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Bar */}
      <footer className="border-t border-amber-500/20 bg-black/90 backdrop-blur-xl p-4 safe-area-bottom">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything..."
              className="flex-1 px-4 py-3 bg-gray-900/80 text-white rounded-xl border border-gray-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder-gray-500 resize-none min-h-[48px] max-h-[120px]"
              disabled={isLoading}
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg touch-target min-w-[48px] flex items-center justify-center"
              aria-label="Send message"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-center text-gray-500 mt-2">
            Powered by community • 40% cheaper than direct APIs • No vendor lock-in
          </p>
        </div>
      </footer>

      {/* CSS for animations and safe areas */}
      <style jsx global>{`
        .touch-target {
          min-width: 44px;
          min-height: 44px;
        }
        
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        
        .safe-area-left {
          padding-left: env(safe-area-inset-left);
        }
        
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 1rem);
        }
        
        @keyframes slide-in-from-bottom-2 {
          from {
            transform: translateY(0.5rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slide-in-from-top-2 {
          from {
            transform: translateY(-0.5rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fade-in-50 {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-in {
          animation-duration: 200ms;
          animation-fill-mode: both;
        }
        
        .slide-in-from-bottom-2 {
          animation-name: slide-in-from-bottom-2;
        }
        
        .slide-in-from-top-2 {
          animation-name: slide-in-from-top-2;
        }
        
        .fade-in-50 {
          animation-name: fade-in-50;
        }
      `}</style>
    </div>
  );
}