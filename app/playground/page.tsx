'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Save, Download, Upload, Trash2, Settings, 
  Copy, RefreshCw, Zap, Brain, MessageSquare, Key,
  Moon, Sun, History, Plus, X, Check, AlertCircle,
  Mic, Volume2, Users
} from 'lucide-react';
import { VoiceInput } from '@/components/voice/VoiceInput';
import { VoiceOutput } from '@/components/voice/VoiceOutput';
import { FEATURES } from '@/lib/features';
import RoundtablePanel from '@/components/RoundtablePanel';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState('groq');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [roundtableMode, setRoundtableMode] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message function
  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLastPrompt(input.trim());
    setInput('');
    setIsStreaming(true);

    try {
      const endpoint = roundtableMode ? '/api/chat/protected' : '/api/chat';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input.trim(),
          model: selectedModel,
          roundtable: roundtableMode,
          messages: [...messages, userMessage]
        }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      if (roundtableMode) {
        // Handle roundtable response
        const data = await response.json();
        setMessages(prev => [...prev, { 
          id: Date.now().toString(),
          role: 'assistant', 
          content: JSON.stringify(data), // This will be handled by RoundtablePanel
          timestamp: new Date()
        }]);
      } else {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = '';

        const assistantId = Date.now().toString();
        
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
              const content = line.slice(6);
              if (content && content !== '') {
                assistantMessage += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  
                  if (lastMessage?.role === 'assistant' && lastMessage.id === assistantId) {
                    lastMessage.content = assistantMessage;
                  } else {
                    newMessages.push({
                      id: assistantId,
                      role: 'assistant',
                      content: assistantMessage,
                      model: selectedModel,
                      timestamp: new Date(),
                      tokens: Math.ceil(assistantMessage.length / 4),
                      cost: (Math.ceil(assistantMessage.length / 4) / 1000) * (MODELS.find(m => m.id === selectedModel)?.costPer1k || 0)
                    });
                  }
                  
                  return newMessages;
                });
              }
            }
          }
        }
        
        const finalCost = (Math.ceil(assistantMessage.length / 4) / 1000) * (MODELS.find(m => m.id === selectedModel)?.costPer1k || 0);
        setTotalCost(prev => prev + finalCost);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Error: Failed to get response. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  // Handle voice transcript
  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
    // Auto-send if setting enabled
    if (FEATURES.voice && transcript.trim()) {
      setTimeout(() => sendMessage(), 500);
    }
  };

  // Copy message to clipboard
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Clear conversation
  const clearConversation = () => {
    if (confirm('Clear all messages?')) {
      setMessages([]);
      setTotalCost(0);
    }
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`border-b ${darkMode ? 'border-gray-800 bg-gray-900/80' : 'border-gray-200 bg-white'} backdrop-blur-sm p-4`}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Brain className="w-6 h-6 text-gold" />
              <h1 className="text-xl font-bold">AI Playground</h1>
              {!roundtableMode && (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-gold`}
                >
                  {MODELS.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.icon} {model.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setRoundtableMode(!roundtableMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  roundtableMode 
                    ? 'bg-vegas-gold text-bg-dark' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
                {roundtableMode ? 'Single Model' : 'Roundtable'}
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-sm">
                Total: <span className="font-mono text-gold">${totalCost.toFixed(4)}</span>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={`border-b ${darkMode ? 'border-gray-800 bg-gray-900/80' : 'border-gray-200 bg-white'} p-4`}>
            <div className="max-w-7xl mx-auto grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm opacity-70">Temperature</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs">{temperature}</span>
              </div>
              <div>
                <label className="text-sm opacity-70">Max Tokens</label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className={`w-full px-2 py-1 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={memoryEnabled}
                  onChange={(e) => setMemoryEnabled(e.target.checked)}
                  className="rounded"
                />
                <label className="text-sm">Memory Enabled</label>
              </div>
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
              {FEATURES.voice && (
                <p className="mt-2 text-sm">
                  <Mic className="inline w-4 h-4 mr-1" />
                  Click the microphone to use voice input
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => {
                // Check if this is a roundtable response
                if (message.role === 'assistant' && message.content.startsWith('{')) {
                  try {
                    const roundtableData = JSON.parse(message.content);
                    if (roundtableData.models && Array.isArray(roundtableData.models)) {
                      return (
                        <div key={message.id} className="w-full">
                          <RoundtablePanel
                            prompt={lastPrompt}
                            models={roundtableData.models}
                            onRetry={() => sendMessage()}
                          />
                        </div>
                      );
                    }
                  } catch (e) {
                    // Not JSON, render as normal message
                  }
                }

                return (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-gold to-gold-dark text-black'
                          : message.content.startsWith('Error:')
                          ? 'bg-red-600 text-white'
                          : darkMode
                          ? 'bg-gray-800 border border-gray-700'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-xs opacity-70 mb-1 flex items-center gap-2">
                            {message.role === 'assistant' && message.model && (
                              <span>{MODELS.find(m => m.id === message.model)?.icon} {message.model}</span>
                            )}
                            <span>{message.timestamp.toLocaleTimeString()}</span>
                          </div>
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          {message.tokens && (
                            <div className="text-xs opacity-70 mt-2">
                              {message.tokens} tokens • ${message.cost?.toFixed(4) || '0.0000'}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {message.role === 'assistant' && FEATURES.voice && (
                            <VoiceOutput 
                              text={message.content} 
                              voice="nova"
                              provider="openai"
                            />
                          )}
                          <button
                            onClick={() => copyMessage(message.content)}
                            className="p-1.5 hover:bg-gray-600 rounded opacity-70 hover:opacity-100"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className={`rounded-lg px-4 py-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-gold rounded-full animate-pulse delay-75" />
                      <div className="w-2 h-2 bg-gold rounded-full animate-pulse delay-150" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`border-t ${darkMode ? 'border-gray-800 bg-gray-900/80' : 'border-gray-200 bg-white'} p-4`}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-2">
              {FEATURES.voice && (
                <VoiceInput 
                  onTranscript={handleVoiceTranscript}
                  provider="whisper"
                  className="mb-1"
                />
              )}
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your message... (Shift+Enter for new line)"
                  className={`w-full px-4 py-3 rounded-lg resize-none ${
                    darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-gold`}
                  rows={3}
                  disabled={isStreaming}
                />
              </div>
              <div className="flex flex-col gap-2 mb-1">
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming}
                  className="p-3 bg-gradient-to-r from-gold to-gold-dark text-black rounded-lg hover:from-gold-dark hover:to-gold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
                <button
                  onClick={clearConversation}
                  className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}