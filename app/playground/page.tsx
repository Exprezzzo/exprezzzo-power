// app/playground/page.tsx
// **FIXED: Ensure ALL used lucide-react icons are imported .**

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
// --- CRITICAL FIX: Ensure ALL these icons are in this import list ---
// These icons are used in the sidebar and main chat area.
import { Send, Menu, X, History, FileText, Key, Activity, DollarSign, AlertCircle, Zap, Upload, Settings, Brain, Code } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  cost?: number;
  tokens?: number;
  error?: boolean;
}

export default function AIPlayground() {
  const { user, loading } = useAuth(); // Get user and loading state
  const router = useRouter(); // Initialize useRouter

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');

  const availableModels = [
    { id: 'gpt-4o', name: 'GPT-4o', icon: <Brain size={16} /> },
    { id: 'llama3-8b-8192', name: 'Llama 3 8B', icon: <Code size={16} /> },
    { id: 'gemini-pro', name: 'Google Gemini Pro', icon: <Brain size={16} /> },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', icon: <Brain size={16} /> },
    // Add more models as needed
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // CRITICAL: Access Control Logic
  useEffect(() => {
    if (!loading) { // Only act once authentication state is known
      if (!user) {
        // If no user, redirect to login
        router.push('/login');
      } else if (!user.isPro) {
        // If user exists but is not Pro, redirect to pricing
        router.push('/pricing');
      }
      // If user exists AND isPro, they stay on this page.
    }
  }, [user, loading, router]);

  // Show loading or redirecting state while auth is being processed
  if (loading || (!user && !loading) || (user && !user.isPro && !loading)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-600 to-purple-800 text-white">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h1 className="text-2xl font-bold">Checking your access...</h1>
          <p className="text-lg">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, userMessage],
          userId: user?.uid, // Pass userId for tracking
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch AI response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to get reader from response body.');

      let assistantResponseContent = '';
      const assistantMessage: Message = { role: 'assistant', content: '', model: selectedModel };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        assistantResponseContent += chunk;

        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1].content = assistantResponseContent;
          return newMessages;
        });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, prevMessages.length - 1), // Remove the last (empty) assistant message
        {
          role: 'assistant',
          content: `Error: ${error.message || 'An unknown error occurred.'}`,
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // NEW: Sidebar Button Functions (from previous comprehensive response)
  const handleNewChat = () => {
    setMessages([]); // Clear chat history
    setInput('');    // Clear input
    setSidebarOpen(false); // Close sidebar
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected for upload:', file.name);
    alert(`File upload is being implemented! Selected: ${file.name}`);
  };

  const handleAPIKeys = () => {
    router.push('/api-keys'); // Navigate to API Keys page (you'll need to create app/api-keys/page.tsx)
    setSidebarOpen(false);
  };

  const handleUsage = () => {
    router.push('/usage'); // Navigate to Usage page (you'll need to create app/usage/page.tsx)
    setSidebarOpen(false);
  };

  const handlePricing = () => {
    router.push('/pricing'); // Redirect to pricing page
    setSidebarOpen(false);
  };

  const handleChatHistory = () => {
    router.push('/chat-history'); // Navigate to Chat History page (you'll need to create app/chat-history/page.tsx)
    setSidebarOpen(false);
  };


  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white p-4 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-20`}
      >
        <button className="md:hidden absolute top-4 right-4 text-white" onClick={toggleSidebar}>
          <X size={24} />
        </button>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Exprezzzo Power</h2>
        </div>
        <nav>
          <ul>
            <li className="mb-4">
              <button onClick={handleNewChat} className="flex items-center text-lg hover:text-blue-400 w-full text-left">
                <Zap size={20} className="mr-3" /> New Chat
              </button>
            </li>
            <li className="mb-4">
              <label className="flex items-center text-lg hover:text-blue-400 cursor-pointer w-full text-left">
                <Upload size={20} className="mr-3" />
                Upload Document
                {/* Hidden input for file selection */}
                <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.md" />
              </label>
            </li>
            <li className="mb-4">
              <button onClick={handleAPIKeys} className="flex items-center text-lg hover:text-blue-400 w-full text-left">
                <Key size={20} className="mr-3" /> API Keys
              </button>
            </li>
            <li className="mb-4">
              <button onClick={handleUsage} className="flex items-center text-lg hover:text-blue-400 w-full text-left">
                <Activity size={20} className="mr-3" /> Usage
              </button>
            </li>
            <li className="mb-4">
              <button onClick={handlePricing} className="flex items-center text-lg hover:text-blue-400 w-full text-left">
                <DollarSign size={20} className="mr-3" /> Pricing
              </button>
            </li>
            <li className="mb-4">
              <button onClick={handleChatHistory} className="flex items-center text-lg hover:text-blue-400 w-full text-left">
                <History size={20} className="mr-3" /> Chat History
              </button>
            </li>
          </ul>
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-sm">Logged in as: {user?.email || 'Guest'}</p>
          <p className="text-xs text-gray-400">Phoenix Project Architect (v3.1)</p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white p-4 flex items-center justify-between shadow-md md:hidden">
          <button onClick={toggleSidebar} className="text-gray-600">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">AI Playground</h1>
          <div></div> {/* Placeholder for balance */}
        </div>

        {/* Chat Bubbles */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xl px-4 py-2 rounded-lg shadow ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {message.error && <AlertCircle size={16} className="inline-block mr-1 text-red-500" />}
                {message.content}
                {message.model && (
                  <span className="block text-xs text-right opacity-75 mt-1">
                    Model: {availableModels.find(m => m.id === message.model)?.name || message.model}
                  </span>
                )}
                {message.cost !== undefined && (
                  <span className="block text-xs text-right opacity-75">
                    Cost: ${message.cost.toFixed(6)}
                  </span>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xl px-4 py-2 rounded-lg shadow bg-gray-200 text-gray-800">
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 border-t flex items-center">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="p-2 border rounded-md mr-2"
            disabled={isLoading}
          >
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.icon} {model.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            className="ml-2 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
