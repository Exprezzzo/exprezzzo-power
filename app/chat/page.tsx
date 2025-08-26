'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, Send, Settings, Brain, Plus, MessageCircle, DollarSign, Users, TrendingDown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  cost?: number;
  savings?: number;
  model?: string;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

// Mobile swipe gesture hook
function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold: number = 100
): SwipeHandlers {
  const [startX, setStartX] = useState(0);
  const [isMoving, setIsMoving] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsMoving(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMoving) return;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMoving) return;
    
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - startX;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    setIsMoving(false);
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

// Model configurations with Robin Hood savings
const models = [
  { 
    id: 'gpt-4o', 
    name: 'GPT-4o', 
    provider: 'OpenAI',
    directCost: 0.015,
    ourCost: 0.009,
    savings: 40,
    speed: 'Fast'
  },
  { 
    id: 'claude-3-5-sonnet', 
    name: 'Claude 3.5 Sonnet', 
    provider: 'Anthropic',
    directCost: 0.015,
    ourCost: 0.009,
    savings: 40,
    speed: 'Fast'
  },
  { 
    id: 'gpt-3.5-turbo', 
    name: 'GPT-3.5 Turbo', 
    provider: 'OpenAI',
    directCost: 0.001,
    ourCost: 0.0006,
    savings: 40,
    speed: 'Very Fast'
  }
];

// Mobile Sidebar Component
function MobileSidebar({ isOpen, onClose, totalSavings }: { 
  isOpen: boolean; 
  onClose: () => void; 
  totalSavings: number;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Sidebar Panel */}
          <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-gray-900 shadow-2xl flex flex-col animate-slide-right">
            {/* Header with Robin Hood branding */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">EXPREZZZO</h2>
                  <p className="text-sm text-amber-400">Robin Hood AI</p>
                </div>
              </div>
              
              {/* Community Impact Stats */}
              <div className="bg-gradient-to-r from-amber-400/10 to-yellow-600/10 rounded-lg p-4 border border-amber-400/20">
                <h3 className="text-sm font-medium text-amber-400 mb-2">Community Impact</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">Your Savings</span>
                    <span className="text-sm font-bold text-amber-400">${totalSavings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">Community Saved</span>
                    <span className="text-sm font-bold text-green-400">$12,847</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">Active Users</span>
                    <span className="text-sm font-bold text-blue-400">2,341</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Recent Chats</h3>
              <div className="space-y-2">
                {[
                  'Code optimization tips',
                  'Business strategy advice',  
                  'Creative writing help',
                  'Data analysis query'
                ].map((title, i) => (
                  <button
                    key={i}
                    className="w-full p-3 text-left rounded-lg border border-gray-700 hover:border-amber-400/30 hover:bg-amber-400/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-amber-400" />
                      <div>
                        <p className="text-sm text-white group-hover:text-amber-200">{title}</p>
                        <p className="text-xs text-gray-500">2 days ago</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* New Chat Button */}
            <div className="p-4 border-t border-gray-800">
              <button className="w-full bg-gradient-to-r from-amber-400 to-yellow-600 text-black font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:from-amber-500 hover:to-yellow-700 transition-all">
                <Plus className="w-5 h-5" />
                New Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Model Selector with savings display
function ModelSelector({ selectedModel, onModelSelect }: {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentModel = models.find(m => m.id === selectedModel) || models[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm hover:border-amber-400/50 transition-all min-h-[44px]"
      >
        <Brain className="w-4 h-4 text-amber-400" />
        <div className="text-left">
          <div className="text-white font-medium">{currentModel.name}</div>
          <div className="text-xs text-amber-400">-{currentModel.savings}% cost</div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 overflow-hidden">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onModelSelect(model.id);
                setIsOpen(false);
              }}
              className="w-full p-3 text-left hover:bg-amber-400/10 border-b border-gray-700 last:border-b-0 transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-white font-medium">{model.name}</div>
                  <div className="text-xs text-gray-400">{model.provider} • {model.speed}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-amber-400 font-medium">-{model.savings}%</div>
                  <div className="text-xs text-gray-500">${model.ourCost}/1K tokens</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RobinHoodMobileChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [isLoading, setIsLoading] = useState(false);
  const [totalSavings, setTotalSavings] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Swipe handlers
  const swipeHandlers = useSwipeGesture(
    undefined, // onSwipeLeft
    () => isMobile && setShowSidebar(true) // onSwipeRight
  );

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    
    // Hide keyboard on mobile
    if (isMobile && inputRef.current) {
      inputRef.current.blur();
    }
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          settings: {
            temperature: 0.7,
            maxTokens: 1000,
            modelSelection: selectedModel,
            streamingEnabled: false,
          },
          preferredModel: selectedModel as any,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data?.content) {
        const model = models.find(m => m.id === selectedModel) || models[0];
        const estimatedTokens = Math.ceil(data.data.content.length / 4);
        const savings = (model.directCost - model.ourCost) * estimatedTokens / 1000;
        
        setTotalSavings(prev => prev + savings);
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          content: data.data.content,
          role: 'assistant',
          timestamp: new Date(),
          cost: model.ourCost * estimatedTokens / 1000,
          savings: savings,
          model: model.name
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error?.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden" {...swipeHandlers}>
      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        totalSavings={totalSavings}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 min-h-[60px]">
        <button
          onClick={() => setShowSidebar(true)}
          className="p-2 hover:bg-gray-800 rounded-lg md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Menu size={20} className="text-white" />
        </button>
        
        <ModelSelector 
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
        />
        
        <button className="p-2 hover:bg-gray-800 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
          <Settings size={20} className="text-white" />
        </button>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center mb-6">
              <Shield className="w-10 h-10 text-black" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Robin Hood AI
            </h2>
            <p className="text-gray-400 max-w-md mb-6">
              Democratizing AI access with 40% cost savings. Every conversation helps our community save more.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
              <div className="bg-gradient-to-br from-amber-400/10 to-yellow-600/10 rounded-lg p-4 border border-amber-400/20">
                <TrendingDown className="w-6 h-6 text-amber-400 mb-2" />
                <div className="text-sm font-medium text-white">40% Cheaper</div>
                <div className="text-xs text-gray-400">Than direct API access</div>
              </div>
              <div className="bg-gradient-to-br from-green-400/10 to-emerald-600/10 rounded-lg p-4 border border-green-400/20">
                <Users className="w-6 h-6 text-green-400 mb-2" />
                <div className="text-sm font-medium text-white">Community</div>
                <div className="text-xs text-gray-400">Powered platform</div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] md:max-w-[70%] ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                  <div
                    className={`p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-black'
                        : 'bg-gray-800 text-white border border-gray-700'
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </div>
                    {message.role === 'assistant' && message.savings && (
                      <div className="mt-2 pt-2 border-t border-gray-700 flex items-center justify-between text-xs">
                        <span className="text-gray-400">{message.model}</span>
                        <span className="text-green-400 font-medium">
                          Saved ${message.savings.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="max-w-[85%] md:max-w-[70%] mr-12">
                  <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0, 150, 300].map(delay => (
                          <span 
                            key={delay}
                            className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" 
                            style={{ animationDelay: `${delay}ms` }} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-400 ml-2">
                        Robin Hood AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      {/* Input Area */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Robin Hood AI anything..."
            className="flex-1 min-h-[44px] max-h-32 px-4 py-3 rounded-2xl border border-gray-700 resize-none text-[16px] leading-5 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={isLoading}
            style={{ fontSize: '16px' }} // Prevent iOS zoom
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={cn(
              "min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all",
              inputValue.trim() && !isLoading
                ? "bg-gradient-to-r from-amber-400 to-yellow-600 text-black shadow-lg hover:from-amber-500 hover:to-yellow-700" 
                : "bg-gray-700 text-gray-400"
            )}
          >
            <Send size={18} />
          </button>
        </div>
        
        {/* Savings Display */}
        {totalSavings > 0 && (
          <div className="flex justify-center mt-2">
            <div className="bg-gradient-to-r from-green-400/10 to-emerald-600/10 rounded-full px-4 py-1 border border-green-400/20">
              <div className="flex items-center gap-2 text-xs">
                <DollarSign className="w-3 h-3 text-green-400" />
                <span className="text-green-400 font-medium">
                  Total Saved: ${totalSavings.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-right {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .animate-slide-right {
          animation: slide-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}