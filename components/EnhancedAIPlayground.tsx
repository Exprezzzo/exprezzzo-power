'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Send, Settings, Brain, Zap, Copy, Download, Maximize2, Minimize2, Clock, DollarSign, Hash, FileText, FileJson, Check, AlertCircle } from 'lucide-react';

interface PlaygroundSettings {
  temperature: number;
  maxTokens: number;
  streaming: boolean;
  jsonMode: boolean;
  provider: string;
}

interface MessageMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  tokens?: number;
  estimatedCost?: number;
}

interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metrics?: MessageMetrics;
  isStreaming?: boolean;
}

interface CopyState {
  messageId: string;
  copied: boolean;
}

export default function EnhancedAIPlayground() {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant. Be concise and accurate.');
  const [userPrompt, setUserPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copyStates, setCopyStates] = useState<CopyState[]>([]);
  const [settings, setSettings] = useState<PlaygroundSettings>({
    temperature: 0.7,
    maxTokens: 1000,
    streaming: true,
    jsonMode: false,
    provider: 'openai'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef<string>('');

  const providers = [
    { id: 'openai', name: 'OpenAI GPT-4o', color: 'bg-green-600', cost: 0.015 },
    { id: 'anthropic', name: 'Claude 3 Opus', color: 'bg-orange-600', cost: 0.015 },
    { id: 'gemini', name: 'Google Gemini Pro', color: 'bg-blue-600', cost: 0.0005 },
    { id: 'groq', name: 'Groq Llama 3', color: 'bg-purple-600', cost: 0.0008 }
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
      e.preventDefault();
      setIsFullscreen(!isFullscreen);
    }
  }, [userPrompt, systemPrompt, settings, isFullscreen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Copy functionality
  const copyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyStates(prev => [...prev.filter(c => c.messageId !== messageId), { messageId, copied: true }]);
      setTimeout(() => {
        setCopyStates(prev => prev.filter(c => c.messageId !== messageId));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Calculate metrics
  const calculateMetrics = (content: string, duration: number, provider: string): MessageMetrics['tokens'] => {
    const tokens = Math.floor(content.length / 4); // Rough token estimation
    const costPer1k = providers.find(p => p.id === provider)?.cost || 0.001;
    return {
      tokens,
      estimatedCost: (tokens * costPer1k) / 1000
    };
  };

  // Export functionality
  const exportConversation = (format: 'json' | 'txt') => {
    const conversation = {
      timestamp: new Date().toISOString(),
      settings: settings,
      systemPrompt: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        metrics: m.metrics
      }))
    };

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(conversation, null, 2);
      filename = `exprezzzo-conversation-${Date.now()}.json`;
      mimeType = 'application/json';
    } else {
      content = `EXPREZZZO Power Playground Export
Generated: ${new Date().toLocaleString()}
Provider: ${providers.find(p => p.id === settings.provider)?.name}
Temperature: ${settings.temperature}
Max Tokens: ${settings.maxTokens}

System Prompt:
${systemPrompt}

Conversation:
${messages.map(m => {
  const metrics = m.metrics?.duration ? ` (${m.metrics.duration}ms, ${m.metrics.tokens || 0} tokens, $${(m.metrics.estimatedCost || 0).toFixed(4)})` : '';
  return `
[${m.timestamp.toLocaleString()}] ${m.role.toUpperCase()}${metrics}:
${m.content}
`;
}).join('\n')}`;
      filename = `exprezzzo-conversation-${Date.now()}.txt`;
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSend = async () => {
    if (!userPrompt.trim() || isLoading) return;

    const startTime = Date.now();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userPrompt,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setUserPrompt('');
    setIsLoading(true);

    // Create assistant message with streaming indicator
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: settings.streaming,
      metrics: {
        startTime
      }
    };

    setMessages(prev => [...prev, assistantMessage]);
    streamingMessageRef.current = '';

    try {
      const requestBody = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        provider: settings.provider,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        streaming: settings.streaming
      };

      const response = await fetch('/api/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (settings.streaming) {
        // Handle Server-Sent Events stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                // Streaming complete - calculate final metrics
                const finalMetrics = calculateMetrics(streamingMessageRef.current, duration, settings.provider);
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessage.id
                    ? {
                        ...msg,
                        isStreaming: false,
                        metrics: {
                          startTime,
                          endTime,
                          duration,
                          tokens: finalMetrics?.tokens,
                          estimatedCost: finalMetrics?.estimatedCost
                        }
                      }
                    : msg
                ));
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  streamingMessageRef.current += parsed.content;
                  
                  // Update message with streaming content
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: streamingMessageRef.current }
                      : msg
                  ));
                }
              } catch (e) {
                // Ignore parsing errors for streaming
              }
            }
          }
        }
      } else {
        // Handle complete response
        const data = await response.json();
        const finalMetrics = calculateMetrics(data.content || '', duration, settings.provider);
        
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: data.content || 'No response received',
                isStreaming: false,
                metrics: {
                  startTime,
                  endTime,
                  duration,
                  tokens: finalMetrics?.tokens,
                  estimatedCost: finalMetrics?.estimatedCost
                }
              }
            : msg
        ));
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessage.id
          ? {
              ...msg,
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
              isStreaming: false,
              metrics: {
                startTime,
                endTime: Date.now(),
                duration: Date.now() - startTime
              }
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setCopyStates([]);
  };

  const getCopyIcon = (messageId: string) => {
    const copyState = copyStates.find(c => c.messageId === messageId);
    return copyState?.copied ? Check : Copy;
  };

  const getCopyColor = (messageId: string) => {
    const copyState = copyStates.find(c => c.messageId === messageId);
    return copyState?.copied ? 'text-green-400' : 'text-gray-400 hover:text-white';
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-gray-900 text-white transition-all duration-300`}>
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-blue-400" />
              <h1 className="text-2xl font-bold">Enhanced AI Playground</h1>
              {isFullscreen && (
                <span className="text-sm bg-blue-600 px-2 py-1 rounded-full">Fullscreen Mode</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-gray-400">
                  {providers.find(p => p.id === settings.provider)?.name}
                </span>
              </div>
              
              {/* Export Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => exportConversation('json')}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center space-x-1"
                  title="Export as JSON"
                >
                  <FileJson className="h-3 w-3" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => exportConversation('txt')}
                  className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 rounded-md transition-colors flex items-center space-x-1"
                  title="Export as TXT"
                >
                  <FileText className="h-3 w-3" />
                  <span>TXT</span>
                </button>
              </div>
              
              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-gray-700 rounded-md transition-colors"
                title={isFullscreen ? 'Exit fullscreen (Cmd+F)' : 'Enter fullscreen (Cmd+F)'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              
              <button
                onClick={clearMessages}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Settings Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 space-y-6 sticky top-24">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold">Settings</h3>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  AI Provider
                </label>
                <select
                  value={settings.provider}
                  onChange={(e) => setSettings(prev => ({ ...prev, provider: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-400 mt-1">
                  ~${providers.find(p => p.id === settings.provider)?.cost}/1K tokens
                </div>
              </div>

              {/* Temperature Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temperature: {settings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Focused</span>
                  <span>Creative</span>
                </div>
              </div>

              {/* Max Tokens Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Tokens: {settings.maxTokens}
                </label>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={settings.maxTokens}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>100</span>
                  <span>4000</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.streaming}
                    onChange={(e) => setSettings(prev => ({ ...prev, streaming: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Stream Response</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.jsonMode}
                    onChange={(e) => setSettings(prev => ({ ...prev, jsonMode: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">JSON Mode</span>
                </label>
              </div>

              {/* Session Stats */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Session Stats</h4>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Messages:</span>
                    <span>{messages.filter(m => m.role !== 'system').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Tokens:</span>
                    <span>{messages.reduce((sum, m) => sum + (m.metrics?.tokens || 0), 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Cost:</span>
                    <span>${messages.reduce((sum, m) => sum + (m.metrics?.estimatedCost || 0), 0).toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
              
              {/* System Prompt */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  System Prompt
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Define the AI's behavior and context..."
                  className="w-full h-20 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Messages Display */}
              <div className={`flex-1 mb-6 bg-gray-900 rounded-lg p-4 overflow-y-auto ${isFullscreen ? 'max-h-[60vh]' : 'max-h-96'}`}>
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Start a conversation with the AI</p>
                    <p className="text-sm mt-1">Use Cmd+Enter to send • Cmd+F for fullscreen</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const CopyIcon = getCopyIcon(message.id);
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-3xl px-4 py-3 rounded-lg relative group ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-100'
                            }`}
                          >
                            {/* Copy Button */}
                            <button
                              onClick={() => copyMessage(message.id, message.content)}
                              className={`absolute top-2 right-2 p-1 rounded hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity ${getCopyColor(message.id)}`}
                              title="Copy message"
                            >
                              <CopyIcon className="w-3 h-3" />
                            </button>

                            <div className="pr-8">
                              {/* Message Content */}
                              <div className="whitespace-pre-wrap">
                                {message.content}
                                {message.isStreaming && (
                                  <span className="inline-block w-2 h-5 bg-current ml-1 animate-pulse" />
                                )}
                              </div>
                              
                              {/* Message Metrics */}
                              {message.role === 'assistant' && message.metrics && (
                                <div className="flex items-center space-x-4 mt-3 pt-2 border-t border-gray-600 text-xs opacity-70">
                                  {message.metrics.duration && (
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{message.metrics.duration}ms</span>
                                    </div>
                                  )}
                                  {message.metrics.tokens && (
                                    <div className="flex items-center space-x-1">
                                      <Hash className="w-3 h-3" />
                                      <span>{message.metrics.tokens} tokens</span>
                                    </div>
                                  )}
                                  {message.metrics.estimatedCost && (
                                    <div className="flex items-center space-x-1">
                                      <DollarSign className="w-3 h-3" />
                                      <span>${message.metrics.estimatedCost.toFixed(4)}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Timestamp */}
                              <div className="text-xs opacity-50 mt-2">
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* User Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Your Message
                </label>
                <div className="flex space-x-3">
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="Type your message... (Cmd+Enter to send, Cmd+F for fullscreen)"
                    className="flex-1 h-24 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !userPrompt.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isLoading ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
                <div className="text-xs text-gray-500 space-x-4">
                  <kbd className="bg-gray-700 px-1 py-0.5 rounded">Cmd+Enter</kbd> to send
                  <kbd className="bg-gray-700 px-1 py-0.5 rounded">Cmd+F</kbd> for fullscreen
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}