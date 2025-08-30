'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, User, Sparkles, Zap, Star } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  provider?: string;
  cost?: number;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Welcome to EXPREZZZ! I'm your AI assistant powered by the world's most advanced models at 40-60% lower costs. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
      provider: 'kani',
      cost: 0
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('auto');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const totalCost = useMemo(() => 
    messages.reduce((sum, msg) => sum + (msg.cost || 0), 0), [messages]
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          provider: selectedProvider === 'auto' ? undefined : selectedProvider
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        sender: 'bot',
        timestamp: new Date(),
        provider: 'kani',
        cost: 0
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));
        
        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMessage.id 
                  ? { ...msg, content: msg.content + parsed.token }
                  : msg
              ));
            }
            if (parsed.provider) {
              assistantMessage.provider = parsed.provider;
            }
            if (parsed.cost) {
              assistantMessage.cost = parsed.cost;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        provider: 'error',
        cost: 0
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate-dark via-chocolate-darker to-black text-white">
      {/* Header */}
      <div className="border-b border-chocolate-surface/30 backdrop-blur-sm bg-black/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-gold to-gold-dark flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold">EXPREZZZ Chat</h1>
              <p className="text-sm text-gray-400">40-60% cheaper than direct APIs</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs text-gray-400">Session Cost</p>
              <p className="text-sm font-medium text-gold">${totalCost.toFixed(4)}</p>
            </div>
            <select 
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="bg-chocolate-surface border border-chocolate-surface rounded-lg px-3 py-1 text-sm"
            >
              <option value="auto">Auto Route</option>
              <option value="kani">Kani (Fastest)</option>
              <option value="openai">OpenAI GPT-4</option>
              <option value="anthropic">Claude 3.5</option>
              <option value="cohere">Cohere</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="max-w-4xl mx-auto px-4 py-6 flex-1 overflow-y-auto">
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-start space-x-3 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' 
                      ? 'bg-gold text-black' 
                      : 'bg-gradient-to-r from-sovereign to-sovereign-dark text-white'
                  }`}>
                    {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-4 py-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-gold text-black'
                        : 'bg-chocolate-surface border border-chocolate-surface/30'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.sender === 'bot' && (
                      <div className="flex items-center mt-2 text-xs text-gray-400 space-x-3">
                        <span className="flex items-center space-x-1">
                          <Zap className="w-3 h-3" />
                          <span>{message.provider || 'kani'}</span>
                        </span>
                        {message.cost !== undefined && (
                          <span className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>${message.cost.toFixed(4)}</span>
                          </span>
                        )}
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-2xl">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sovereign to-sovereign-dark flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-chocolate-surface border border-chocolate-surface/30 rounded-lg px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="border-t border-chocolate-surface/30 backdrop-blur-sm bg-black/20 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything... (40-60% cheaper than direct APIs)"
                className="w-full bg-chocolate-surface border border-chocolate-surface/30 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gold text-black rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-dark transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Powered by multiple AI providers • Auto-routing for best performance • Real-time cost tracking
          </p>
        </div>
      </div>
    </div>
  );
}