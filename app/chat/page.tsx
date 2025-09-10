'use client';

import { useState } from 'react';
import { Send, Bot, User, Users, Settings } from 'lucide-react';
import RoundtablePanel from '@/components/RoundtablePanel';

export default function ChatPage() {
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roundtableMode, setRoundtableMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo');
  const [lastPrompt, setLastPrompt] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setLastPrompt(input);
    setInput('');
    setIsLoading(true);

    try {
      const endpoint = roundtableMode ? '/api/chat/protected' : '/api/chat';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          model: selectedModel,
          roundtable: roundtableMode,
          messages: [...messages, userMessage]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Chat failed');
      }
      
      if (roundtableMode) {
        // Handle roundtable response
        const data = await response.json();
        setMessages(prev => [...prev, { 
          role: 'roundtable', 
          content: JSON.stringify(data) // This will be handled by RoundtablePanel
        }]);
      } else {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = { role: 'assistant', content: '' };
        
        if (reader) {
          setMessages(prev => [...prev, assistantMessage]);
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                const content = line.slice(6);
                if (content && content !== '') {
                  assistantMessage.content += content;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {...assistantMessage};
                    return updated;
                  });
                }
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: error.message || 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="font-brand text-3xl gold-gradient-text mb-6">Chat</h1>
      
      <div className="surface rounded-lg p-4 h-[60vh] overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted opacity-60 mt-20">
            Start a conversation with AI
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'gold-gradient' : 'surface border border-gold/20'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-lg ${
                msg.role === 'user' ? 'bg-gold/20' : 'surface'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full surface border border-gold/20 flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="surface p-3 rounded-lg">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-3 rounded-lg surface border border-gold/20 focus:border-gold outline-none bg-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="cta-button flex items-center gap-2"
        >
          <Send size={20} />
          Send
        </button>
      </form>
    </div>
  );
}