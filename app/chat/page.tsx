'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Menu, Send, X, ChevronDown, Shield, Users, Zap, AlertCircle } from 'lucide-react';

const AI_MODELS = [
  { id: 'groq', name: 'Lightning Fast', icon: '⚡', saving: '75% cheaper', speed: '~250ms' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', icon: '🧠', saving: '40% cheaper', speed: '~800ms' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', icon: '🛡️', saving: '40% cheaper', speed: '~600ms' },
  { id: 'gemini-1.5-flash', name: 'Gemini Flash', icon: '💎', saving: '45% cheaper', speed: '~500ms' }
];

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('groq');
  const [showModels, setShowModels] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [totalSaved, setTotalSaved] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleViewport = () => {
      if (window.visualViewport) {
        document.documentElement.style.height = `${window.visualViewport.height}px`;
      }
    };
    window.visualViewport?.addEventListener('resize', handleViewport);
    handleViewport();
    return () => window.visualViewport?.removeEventListener('resize', handleViewport);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { 
      id: Date.now(), 
      role: 'user', 
      content: input.trim() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMsg], 
          model: selectedModel 
        })
      });

      if (!response.ok) throw new Error('Network error');
      
      const data = await response.json();
      const cost = data.cost || 0.001;
      const saved = cost * 0.4;
      
      setTotalSaved(prev => prev + saved);
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.content || 'Response received',
        model: selectedModel,
        cost: cost,
        saved: saved
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: '⚠️ Connection issue. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-lg border-b border-amber-500/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-amber-500/10 rounded-lg transition-colors duration-200"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6 text-amber-500" />
          </button>
          
          <button 
            onClick={() => setShowModels(!showModels)}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-lg hover:bg-amber-500/20 transition-colors duration-200"
          >
            <span className="text-lg">{AI_MODELS.find(m => m.id === selectedModel)?.icon}</span>
            <div className="text-left">
              <div className="text-amber-500 font-medium text-sm">
                {AI_MODELS.find(m => m.id === selectedModel)?.name}
              </div>
              <div className="text-amber-300/60 text-xs">
                {AI_MODELS.find(m => m.id === selectedModel)?.saving}
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform ${showModels ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </header>

      {/* Model Selector */}
      {showModels && (
        <div className="absolute top-20 right-4 z-50 bg-gray-900/95 backdrop-blur-xl border border-amber-500/20 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
          <div className="p-2 bg-amber-500/10 border-b border-amber-500/20">
            <p className="text-xs text-amber-300 text-center font-medium">🏹 Community-Powered AI</p>
          </div>
          {AI_MODELS.map(model => (
            <button
              key={model.id}
              onClick={() => { setSelectedModel(model.id); setShowModels(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-amber-500/10 transition-colors duration-200"
            >
              <span className="text-xl">{model.icon}</span>
              <div className="text-left flex-1">
                <div className="text-white font-medium">{model.name}</div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-xs">{model.saving}</span>
                  <span className="text-gray-500 text-xs">• {model.speed}</span>
                </div>
              </div>
              {selectedModel === model.id && (
                <Shield className="w-4 h-4 text-amber-500" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-black/95 backdrop-blur-xl transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-amber-500">Exprezzzo Power</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-amber-500/10 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-amber-300" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="bg-gradient-to-r from-amber-500/20 to-emerald-500/20 p-4 rounded-xl mb-4 border border-amber-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-white">Community Impact</h3>
            </div>
            <p className="text-sm text-gray-300">
              Session savings: <span className="text-emerald-400 font-bold">${totalSaved.toFixed(4)}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              40% less than direct API costs
            </p>
          </div>
          
          <button
            onClick={() => { setMessages([]); setSidebarOpen(false); setTotalSaved(0); }}
            className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg transform hover:scale-105"
          >
            <Zap className="inline w-4 h-4 mr-2" />
            New Chat
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-20 animate-in fade-in duration-500">
              <Shield className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">
                AI for Everyone
              </h1>
              <p className="text-gray-400 mb-6">
                Premium AI access at community prices
              </p>
              <div className="grid gap-2 max-w-md mx-auto text-left">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-emerald-400">✓</span> 40% cheaper than direct APIs
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-emerald-400">✓</span> No vendor lock-in
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-emerald-400">✓</span> Community-powered platform
                </div>
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={msg.id} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'} animate-in slide-in-from-bottom-2`}>
              <div className={`inline-block max-w-[85%] px-4 py-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium shadow-lg' 
                  : 'bg-gray-800/80 backdrop-blur text-white border border-gray-700'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.saved && (
                  <div className="text-xs mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
                    <span className="opacity-70">Cost: ${msg.cost.toFixed(4)}</span>
                    <span className="text-emerald-400 font-medium">Saved: ${msg.saved.toFixed(4)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="text-left mb-4">
              <div className="inline-block px-4 py-3 bg-gray-800/80 rounded-2xl border border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-75" />
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-150" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Bar */}
      <footer className="border-t border-amber-500/20 bg-black/80 backdrop-blur-lg p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask anything..."
              className="flex-1 px-4 py-3 bg-gray-900/80 text-white rounded-xl border border-gray-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder-gray-500 transition-all duration-200"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-amber-600 hover:to-amber-700 transition-all duration-200 min-w-[44px] shadow-lg transform hover:scale-105 disabled:hover:scale-100"
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
            🏹 Robin Hood Protocol • Democratizing AI for everyone
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Shield className="w-12 h-12 text-amber-500 animate-pulse" />
      </div>
    }>
      <ChatInterface />
    </Suspense>
  );
}
