'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Copy, 
  Download, 
  Settings, 
  Moon, 
  Sun, 
  Trash2, 
  History, 
  Zap,
  Brain,
  Sparkles,
  Clock,
  Hash,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  model: string;
  icon: string;
  color: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface PlaygroundSettings {
  temperature: number;
  maxTokens: number;
  streaming: boolean;
  jsonMode: boolean;
}

const PROVIDERS: Provider[] = [
  { id: 'openai', name: 'OpenAI', model: 'gpt-4', icon: '🧠', color: 'bg-green-500' },
  { id: 'anthropic', name: 'Anthropic', model: 'claude-3-opus', icon: '🎭', color: 'bg-orange-500' },
  { id: 'gemini', name: 'Google', model: 'gemini-pro', icon: '💎', color: 'bg-blue-500' },
  { id: 'groq', name: 'Groq', model: 'mixtral-8x7b', icon: '⚡', color: 'bg-purple-500' },
];

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function PlaygroundPage() {
  // Core state
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Settings state
  const [settings, setSettings] = useState<PlaygroundSettings>({
    temperature: 0.7,
    maxTokens: 2000,
    streaming: true,
    jsonMode: false,
  });

  // UI state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Refs
  const responseRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load saved data on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('exprezzzo-theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }

      const savedHistory = localStorage.getItem('exprezzzo-prompt-history');
      if (savedHistory) {
        setPromptHistory(JSON.parse(savedHistory));
      }

      const savedSettings = localStorage.getItem('exprezzzo-settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      const savedProvider = localStorage.getItem('exprezzzo-provider');
      if (savedProvider) {
        setSelectedProvider(savedProvider);
      }
    } catch (error) {
      console.warn('Failed to load saved data:', error);
    }
  }, []);

  // Save theme changes
  useEffect(() => {
    localStorage.setItem('exprezzzo-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Save settings changes
  useEffect(() => {
    localStorage.setItem('exprezzzo-settings', JSON.stringify(settings));
  }, [settings]);

  // Save provider changes
  useEffect(() => {
    localStorage.setItem('exprezzzo-provider', selectedProvider);
  }, [selectedProvider]);

  // Count tokens in prompt
  useEffect(() => {
    const tokens = Math.ceil(prompt.length / 4); // Rough estimation
    setTokenCount(tokens);
  }, [prompt]);

  // Toast management
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSendMessage();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPrompt('');
        setResponse('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [prompt, selectedProvider, settings]);

  // Auto-resize textarea
  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.style.height = 'auto';
      promptRef.current.style.height = `${promptRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Auto-scroll response
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  const handleSendMessage = async () => {
    if (!prompt.trim() || isLoading) return;

    const currentPrompt = prompt.trim();
    const startTime = Date.now();

    // Update history
    const newHistory = [currentPrompt, ...promptHistory.filter(h => h !== currentPrompt)].slice(0, 10);
    setPromptHistory(newHistory);
    localStorage.setItem('exprezzzo-prompt-history', JSON.stringify(newHistory));

    setIsLoading(true);
    setIsStreaming(settings.streaming);
    setResponse('');
    setResponseTime(null);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      const messages: Message[] = [
        { role: 'user', content: currentPrompt }
      ];

      if (settings.jsonMode) {
        messages.unshift({
          role: 'system',
          content: 'You must respond with valid JSON only. Do not include any text outside of the JSON response.'
        });
      }

      const requestBody = {
        provider: selectedProvider,
        messages,
        stream: settings.streaming,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        ...(settings.jsonMode && { response_format: { type: 'json_object' } })
      };

      console.log('Sending request:', requestBody);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      if (settings.streaming) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        if (!reader) {
          throw new Error('No response stream available');
        }

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            setIsStreaming(false);
            setResponseTime(Date.now() - startTime);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              if (data === '[DONE]') {
                setIsStreaming(false);
                setResponseTime(Date.now() - startTime);
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullResponse += parsed.content;
                  setResponse(fullResponse);
                }
              } catch (e) {
                // Handle raw text chunks
                if (data && data !== '[DONE]') {
                  fullResponse += data;
                  setResponse(fullResponse);
                }
              }
            }
          }
        }
      } else {
        const data = await response.json();
        setResponse(data.content || data.response || 'No response received');
        setResponseTime(Date.now() - startTime);
      }

      addToast('Response generated successfully', 'success');

    } catch (error: any) {
      console.error('API Error:', error);
      
      if (error.name === 'AbortError') {
        setResponse('Request was cancelled.');
        addToast('Request cancelled', 'info');
      } else {
        const errorMessage = error.message || 'An unknown error occurred';
        setResponse(`Error: ${errorMessage}`);
        addToast(`Error: ${errorMessage}`, 'error');
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleCopyResponse = async () => {
    if (!response) return;

    try {
      await navigator.clipboard.writeText(response);
      setIsCopied(true);
      addToast('Response copied to clipboard', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      addToast('Failed to copy response', 'error');
    }
  };

  const handleExportResponse = () => {
    if (!response) return;

    const provider = PROVIDERS.find(p => p.id === selectedProvider);
    const exportData = {
      timestamp: new Date().toISOString(),
      provider: provider?.name || selectedProvider,
      model: provider?.model || 'unknown',
      prompt,
      response,
      settings,
      responseTime,
      tokenCount
    };

    const content = `EXPREZZZO Power Playground Export
Generated: ${new Date().toLocaleString()}
Provider: ${exportData.provider} (${exportData.model})
Response Time: ${responseTime ? `${responseTime}ms` : 'N/A'}
Token Count: ${tokenCount}

PROMPT:
${prompt}

RESPONSE:
${response}

SETTINGS:
Temperature: ${settings.temperature}
Max Tokens: ${settings.maxTokens}
Streaming: ${settings.streaming}
JSON Mode: ${settings.jsonMode}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exprezzzo-${selectedProvider}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast('Response exported successfully', 'success');
  };

  const handleClearAll = () => {
    if (isLoading) {
      abortControllerRef.current?.abort();
    }
    setPrompt('');
    setResponse('');
    setResponseTime(null);
    setIsCopied(false);
    addToast('Cleared all content', 'info');
  };

  const handleHistorySelect = (historicalPrompt: string) => {
    setPrompt(historicalPrompt);
    setShowHistory(false);
    promptRef.current?.focus();
  };

  const currentProvider = PROVIDERS.find(p => p.id === selectedProvider);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-green-500/20 border-green-500/30 text-green-300'
                : toast.type === 'error'
                ? 'bg-red-500/20 border-red-500/30 text-red-300'
                : 'bg-blue-500/20 border-blue-500/30 text-blue-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
              {toast.type === 'info' && <Zap className="w-4 h-4" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors ${
        isDarkMode 
          ? 'bg-gray-900/80 border-gray-800' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-purple-500" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  EXPREZZZO Power
                </h1>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-purple-300">AI Playground</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
                    : 'bg-white hover:bg-gray-100 text-gray-600'
                }`}
                title="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Settings Toggle */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  showSettings
                    ? 'bg-purple-600 text-white'
                    : isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-white hover:bg-gray-100 text-gray-600'
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Clear All */}
              <button
                onClick={handleClearAll}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-red-400'
                    : 'bg-white hover:bg-gray-100 text-red-600'
                }`}
                title="Clear all (Cmd+K)"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              
              {/* Provider Selection */}
              <div className={`p-6 rounded-xl backdrop-blur-sm border transition-colors ${
                isDarkMode
                  ? 'bg-gray-800/50 border-gray-700/50'
                  : 'bg-white/80 border-gray-200/50'
              }`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  AI Provider
                </h3>
                
                <div className="space-y-2">
                  {PROVIDERS.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                      className={`w-full p-3 rounded-lg transition-all text-left ${
                        selectedProvider === provider.id
                          ? 'bg-purple-600 text-white shadow-lg'
                          : isDarkMode
                          ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{provider.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-sm opacity-70">{provider.model}</div>
                        </div>
                        {selectedProvider === provider.id && (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings Panel */}
              {showSettings && (
                <div className={`p-6 rounded-xl backdrop-blur-sm border transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800/50 border-gray-700/50'
                    : 'bg-white/80 border-gray-200/50'
                }`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-400" />
                    Settings
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Temperature */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Temperature</label>
                        <span className="text-sm text-purple-400">{settings.temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={settings.temperature}
                        onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Focused</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    {/* Max Tokens */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Max Tokens</label>
                        <span className="text-sm text-purple-400">{settings.maxTokens.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="4000"
                        step="100"
                        value={settings.maxTokens}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>100</span>
                        <span>4,000</span>
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-sm font-medium">Streaming</span>
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, streaming: !prev.streaming }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.streaming ? 'bg-purple-600' : 'bg-gray-600'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.streaming ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </label>

                      <label className="flex items-center justify-between">
                        <span className="text-sm font-medium">JSON Mode</span>
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, jsonMode: !prev.jsonMode }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.jsonMode ? 'bg-purple-600' : 'bg-gray-600'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.jsonMode ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Prompt History */}
              {promptHistory.length > 0 && (
                <div className={`p-6 rounded-xl backdrop-blur-sm border transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800/50 border-gray-700/50'
                    : 'bg-white/80 border-gray-200/50'
                }`}>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full flex items-center justify-between text-lg font-semibold mb-4"
                  >
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-purple-400" />
                      History
                    </div>
                    {showHistory ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  
                  {showHistory && (
                    <div className="space-y-2">
                      {promptHistory.slice(0, 5).map((historyPrompt, index) => (
                        <button
                          key={index}
                          onClick={() => handleHistorySelect(historyPrompt)}
                          className={`w-full p-3 text-left text-sm rounded-lg transition-colors ${
                            isDarkMode
                              ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          <div className="truncate">{historyPrompt}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <div className="space-y-6">
              
              {/* Input Section */}
              <div className={`p-6 rounded-xl backdrop-blur-sm border transition-colors ${
                isDarkMode
                  ? 'bg-gray-800/50 border-gray-700/50'
                  : 'bg-white/80 border-gray-200/50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-400" />
                    Prompt
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Hash className="w-4 h-4" />
                    <span>{tokenCount} tokens</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <textarea
                    ref={promptRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt here... (Cmd+Enter to send)"
                    className={`w-full min-h-[120px] max-h-[300px] p-4 rounded-lg border transition-colors resize-none ${
                      isDarkMode
                        ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                    disabled={isLoading}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">Cmd</kbd>
                      <span>+</span>
                      <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">Enter</kbd>
                      <span>to send</span>
                    </div>

                    <button
                      onClick={handleSendMessage}
                      disabled={!prompt.trim() || isLoading}
                      className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isStreaming ? 'Streaming...' : 'Processing...'}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send to {currentProvider?.name}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Response Section */}
              {(response || isLoading) && (
                <div className={`p-6 rounded-xl backdrop-blur-sm border transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800/50 border-gray-700/50'
                    : 'bg-white/80 border-gray-200/50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">Response</h3>
                      {currentProvider && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                          <span className="text-xs">{currentProvider.icon}</span>
                          <span className="text-xs font-medium text-purple-300">{currentProvider.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {responseTime && (
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{responseTime}ms</span>
                        </div>
                      )}
                      
                      {response && (
                        <>
                          <button
                            onClick={handleCopyResponse}
                            className={`p-2 rounded-lg transition-colors ${
                              isCopied
                                ? 'bg-green-600 text-white'
                                : isDarkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                            title="Copy response"
                          >
                            {isCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={handleExportResponse}
                            className={`p-2 rounded-lg transition-colors ${
                              isDarkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                            title="Export response"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div
                    ref={responseRef}
                    className={`max-h-[500px] overflow-y-auto p-4 rounded-lg border font-mono text-sm whitespace-pre-wrap ${
                      isDarkMode
                        ? 'bg-gray-900/50 border-gray-600 text-gray-100'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  >
                    {isLoading && !response ? (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Waiting for response...</span>
                      </div>
                    ) : (
                      <>
                        {response}
                        {isStreaming && (
                          <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
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
          background: #8b5cf6;
          cursor: pointer;
          border: none;
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: none;
        }

        .dark .slider::-webkit-slider-track {
          background: #4b5563;
        }
        
        .slider::-webkit-slider-track {
          background: #d1d5db;
          height: 8px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}