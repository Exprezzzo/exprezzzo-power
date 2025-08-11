'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { 
  Send, Save, Download, Upload, Trash2, Settings, 
  Copy, RefreshCw, Zap, Brain, MessageSquare, Key,
  Moon, Sun, History, Plus, X, Check, AlertCircle
} from 'lucide-react';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  timestamp: Date;
  tokens?: number;
  cost?: number;
}

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  model: string;
  temperature: number;
  maxTokens: number;
  memoryEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxTokens: number;
  costPer1k: number;
  icon: string;
}

// Available models
const MODELS: ModelConfig[] = [
  { id: 'groq', name: 'Llama 3 70B (Groq)', provider: 'groq', contextWindow: 8192, maxTokens: 2048, costPer1k: 0.001, icon: '🚀' },
  { id: 'openai', name: 'GPT-4o', provider: 'openai', contextWindow: 128000, maxTokens: 4096, costPer1k: 0.015, icon: '🧠' },
  { id: 'anthropic', name: 'Claude 3 Opus', provider: 'anthropic', contextWindow: 200000, maxTokens: 4096, costPer1k: 0.012, icon: '🎭' },
  { id: 'gemini', name: 'Gemini Pro', provider: 'gemini', contextWindow: 32000, maxTokens: 2048, costPer1k: 0.008, icon: '💎' },
];

export default function PlaygroundPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState('groq');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('exprezzzo_sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        messages: s.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      })));
    } else {
      // Create default session
      createNewSession();
    }
    
    // Load API keys
    const savedKeys = localStorage.getItem('exprezzzo_api_keys');
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }
    
    // Load theme
    const savedTheme = localStorage.getItem('exprezzzo_theme');
    setDarkMode(savedTheme !== 'light');
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('exprezzzo_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Current session
  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Update messages when session changes
  useEffect(() => {
    if (currentSession) {
      setMessages(currentSession.messages);
      setSelectedModel(currentSession.model);
      setTemperature(currentSession.temperature);
      setMaxTokens(currentSession.maxTokens);
      setMemoryEnabled(currentSession.memoryEnabled);
      
      // Calculate totals
      const cost = currentSession.messages.reduce((sum, m) => sum + (m.cost || 0), 0);
      const tokens = currentSession.messages.reduce((sum, m) => sum + (m.tokens || 0), 0);
      setTotalCost(cost);
      setTotalTokens(tokens);
    }
  }, [currentSession]);

  // Create new session
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      name: `Chat ${new Date().toLocaleDateString()}`,
      messages: [],
      model: selectedModel,
      temperature,
      maxTokens,
      memoryEnabled,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setTotalCost(0);
    setTotalTokens(0);
  };

  // Delete session
  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      const remaining = sessions.filter(s => s.id !== id);
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
      } else {
        createNewSession();
      }
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);

    try {
      // Prepare context with memory if enabled
      const context = memoryEnabled ? updatedMessages : [userMessage];
      
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKeys.exprezzzo || process.env.NEXT_PUBLIC_EXPREZZZO_API_KEY || ''
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          providers: [selectedModel],
          maxTokens,
          temperature,
          messages: context.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
          model: selectedModel,
          timestamp: new Date(),
          tokens: data.metadata?.tokens,
          cost: data.metadata?.cost_usd
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        
        // Update session
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? { ...s, messages: finalMessages, updatedAt: new Date() }
            : s
        ));
        
        // Update totals
        setTotalTokens(prev => prev + (data.metadata?.tokens || 0));
        setTotalCost(prev => prev + (data.metadata?.cost_usd || 0));
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  // Export session
  const exportSession = () => {
    if (!currentSession) return;
    
    const dataStr = JSON.stringify(currentSession, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `exprezzzo-chat-${currentSession.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import session
  const importSession = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        imported.id = crypto.randomUUID(); // New ID
        imported.createdAt = new Date(imported.createdAt);
        imported.updatedAt = new Date();
        imported.messages = imported.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        
        setSessions(prev => [...prev, imported]);
        setCurrentSessionId(imported.id);
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import session');
      }
    };
    reader.readAsText(file);
  };

  // Copy message
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Clear messages
  const clearMessages = () => {
    if (confirm('Clear all messages in this session?')) {
      setMessages([]);
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [], updatedAt: new Date() }
          : s
      ));
      setTotalCost(0);
      setTotalTokens(0);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4 animate-pulse" />
          <p>Loading Playground...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={`h-screen flex ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <div className={`w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              EXPREZZZO
            </h1>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded hover:bg-gray-700"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          
          <button
            onClick={createNewSession}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold mb-2 text-gray-400">Sessions</h3>
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`mb-2 p-2 rounded cursor-pointer flex items-center justify-between group ${
                currentSessionId === session.id 
                  ? 'bg-blue-600 text-white' 
                  : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">{session.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500 rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Tokens:</span>
              <span>{totalTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cost:</span>
              <span className="text-green-400">${totalCost.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.icon} {model.name}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setMemoryEnabled(!memoryEnabled)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                memoryEnabled 
                  ? 'bg-green-600 text-white' 
                  : darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            >
              <Brain className="w-4 h-4" />
              Memory {memoryEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearMessages}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="Clear messages"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <button
              onClick={exportSession}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="Export session"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importSession}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="Import session"
            >
              <Upload className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Temperature: {temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Tokens: {maxTokens}</label>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">EXPREZZZO API Key</label>
              <input
                type="password"
                value={apiKeys.exprezzzo || ''}
                onChange={(e) => {
                  const newKeys = { ...apiKeys, exprezzzo: e.target.value };
                  setApiKeys(newKeys);
                  localStorage.setItem('exprezzzo_api_keys', JSON.stringify(newKeys));
                }}
                placeholder="Enter your API key"
                className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
              <p>Choose a model and type your message below</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.content.startsWith('Error:')
                        ? 'bg-red-600 text-white'
                        : darkMode
                        ? 'bg-gray-800 border border-gray-700'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xs opacity-70 mb-1">
                          {message.role === 'assistant' && message.model && (
                            <span className="mr-2">{MODELS.find(m => m.id === message.model)?.icon} {message.model}</span>
                          )}
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        {message.tokens && (
                          <div className="text-xs opacity-70 mt-2">
                            {message.tokens} tokens • ${message.cost?.toFixed(4) || '0.0000'}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="p-1 hover:bg-gray-600 rounded opacity-70 hover:opacity-100"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className={`rounded-lg px-4 py-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse">●</div>
                      <div className="animate-pulse animation-delay-200">●</div>
                      <div className="animate-pulse animation-delay-400">●</div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type your message..."
              disabled={isStreaming}
              className={`flex-1 px-4 py-3 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
