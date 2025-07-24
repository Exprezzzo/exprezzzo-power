// app/playground/page.tsx
// The core AI Chat Playground interface for end-users.

'use client'; // This component uses client-side hooks and features.

import React, { useState } from 'react';
import { Send, Upload, Settings, History, Zap, FileText, Code, Brain } from 'lucide-react'; // Ensure lucide-react is installed

export default function AIPlayground() {
  const [selectedModel, setSelectedModel] = useState('smart-routing');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Welcome to Exprezzzo AI! I can help you with any task using the best AI model for your needs. Try asking me to write code, analyze documents, or have a creative conversation!',
      model: 'system'
    }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);

  const models = [
    { id: 'smart-routing', name: '⚡ Smart Routing', description: 'Auto-selects best model' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Best for complex reasoning' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Best for creative writing' },
    { id: 'gemini-2-pro', name: 'Gemini 2.0 Pro', description: 'Best for multimodal' },
    { id: 'llama-3-70b', name: 'Llama 3 70B', description: 'Open source powerhouse' }
  ];

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = { role: 'user', content: message };
    setMessages([...messages, userMessage]);
    setMessage('');
    setIsStreaming(true);

    // --- Call your actual AI API route here: /api/chat ---
    // For MVP, this might be a simple fetch. Later, it will handle streaming.
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: message, model: selectedModel }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      // For streaming responses, you'd process response.body as a stream.
      // For MVP, let's assume non-streaming simple response for now.
      const data = await response.json();
      const aiResponse = {
        role: 'assistant',
        content: data.response || 'Oops! I had trouble thinking. Try again!',
        model: data.model || selectedModel,
        cost: data.cost || '?',
        tokens: data.tokens || '?'
      };
      setMessages(prev => [...prev, aiResponse]);

    } catch (error: any) {
      console.error('Error calling AI API:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, there was an error connecting to the AI: ${error.message}`, model: 'error' }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="text-yellow-400" />
            Exprezzzo AI
          </h2>
          <p className="text-sm text-gray-400 mt-1">40% cheaper, 100% powerful</p>
        </div>

        <div className="space-y-2 mb-6">
          <button className="w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
            <History className="inline mr-2 h-4 w-4" />
            Chat History
          </button>
          <button className="w-full text-left p-3 hover:bg-gray-700 rounded-lg transition">
            <FileText className="inline mr-2 h-4 w-4" />
            Documents
          </button>
          <button className="w-full text-left p-3 hover:bg-gray-700 rounded-lg transition">
            <Code className="inline mr-2 h-4 w-4" />
            API Keys
          </button>
          <button className="w-full text-left p-3 hover:bg-gray-700 rounded-lg transition">
            <Brain className="inline mr-2 h-4 w-4" />
            Workflows
          </button>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <div className="text-sm">
            <p className="text-gray-400">Usage Today</p>
            <p className="text-2xl font-bold">247 / 1000</p>
            <p className="text-green-400">$0.73 saved</p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Model Selector */}
        <div className="border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {models.map(model => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`px-4 py-2 rounded-lg transition ${
                    selectedModel === model.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title={model.description}
                >
                  {model.name}
                </button>
              ))}
            </div>
            <button className="p-2 hover:bg-gray-700 rounded-lg">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl p-4 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600'
                  : 'bg-gray-700'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.model && msg.role === 'assistant' && (
                  <div className="mt-2 text-xs text-gray-400 flex items-center gap-4">
                    <span>Model: {msg.model}</span>
                    {msg.cost && <span>Cost: ${msg.cost}</span>}
                    {msg.tokens && <span>Tokens: {msg.tokens}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex gap-2">
            <button className="p-3 hover:bg-gray-700 rounded-lg">
              <Upload className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything... I'll route to the best AI for your task"
              className="flex-1 bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || isStreaming}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2"
            >
              <Send className="h-5 w-5" />
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Smart Routing active • Automatically selecting the best model for each query
          </p>
        </div>
      </div>
    </div>
  );
}