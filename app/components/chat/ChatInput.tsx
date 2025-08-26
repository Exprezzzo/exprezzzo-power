'use client';

import { useState } from 'react';
import { Send, Loader2, Paperclip } from 'lucide-react';
import { TouchButton } from '../ui/TouchButton';
import { useKeyboardState } from '../../hooks/useKeyboardHeight';

export default function ChatInput() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { keyboardHeight, isKeyboardOpen, keyboardOffset } = useKeyboardState();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      // TODO: Implement actual chat API call
      console.log('Sending message:', userMessage);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Prevent zoom on iOS
    e.target.style.fontSize = '16px';
    
    // Scroll input into view after keyboard animation
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  return (
    <div 
      className="border-t border-gray-800 bg-gray-900/50 backdrop-blur flex items-center transition-all duration-200"
      style={{ 
        padding: 'var(--chat-padding)',
        paddingBottom: `${keyboardOffset}px`
      }}
    >
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3 w-full">
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={handleInputFocus}
            placeholder="Type your message..."
            className="w-full pr-12 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 touch-input ios-input"
            style={{ 
              height: 'var(--input-height)',
              fontSize: '16px' // Prevents iOS zoom
            }}
            disabled={isLoading}
          />
          
          <TouchButton
            onClick={() => console.log('Attach file clicked')}
            variant="ghost"
            className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[32px] min-w-[32px] p-1.5"
          >
            <Paperclip className="w-4 h-4 text-gray-400" />
          </TouchButton>
        </div>
        
        <TouchButton
          onClick={() => {}} // Form submission handled by onSubmit
          type="submit"
          disabled={!message.trim() || isLoading}
          variant="primary"
          className="px-6 flex items-center gap-2 font-medium"
          style={{ height: 'var(--input-height)' }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send
            </>
          )}
        </TouchButton>
      </form>
    </div>
  );
}