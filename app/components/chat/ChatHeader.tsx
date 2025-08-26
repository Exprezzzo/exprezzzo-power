'use client';

import { ArrowLeft, Settings, Brain } from 'lucide-react';
import { useState } from 'react';
import { TouchButton } from '../ui/TouchButton';
import { ModelSelector } from './ModelSelector';

interface ChatHeaderProps {
  onBackClick: () => void;
}

export default function ChatHeader({ onBackClick }: ChatHeaderProps) {
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo-2024-04-09');

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    console.log('Model changed to:', modelId);
  };

  return (
    <header 
      className="bg-gray-900/50 backdrop-blur border-b border-gray-800 px-4 flex items-center"
      style={{ height: 'var(--header-height)' }}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <TouchButton 
            onClick={onBackClick}
            variant="ghost"
            className="md:hidden min-h-[40px] min-w-[40px] p-2"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </TouchButton>
          
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <h1 className="text-lg font-semibold text-white">AI Playground</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ModelSelector 
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
          />

          <TouchButton 
            onClick={() => console.log('Settings clicked')}
            variant="ghost"
            className="min-h-[40px] min-w-[40px] p-2"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </TouchButton>
        </div>
      </div>
    </header>
  );
}