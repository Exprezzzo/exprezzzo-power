'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Brain, Zap, Clock, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TouchButton } from '../ui/TouchButton';

const models = [
  { 
    id: 'gpt-4-turbo-2024-04-09', 
    name: 'GPT-4 Turbo', 
    description: 'Most capable, balanced speed', 
    contextLength: '128k',
    icon: Brain,
    speed: 'Fast',
    provider: 'OpenAI'
  },
  { 
    id: 'gpt-4o-mini', 
    name: 'GPT-4o Mini', 
    description: 'Efficient and very fast', 
    contextLength: '128k',
    icon: Zap,
    speed: 'Very Fast',
    provider: 'OpenAI'
  },
  { 
    id: 'claude-3-5-sonnet-20241022', 
    name: 'Claude 3.5 Sonnet', 
    description: 'Excellent reasoning & coding', 
    contextLength: '200k',
    icon: Brain,
    speed: 'Fast',
    provider: 'Anthropic'
  },
  { 
    id: 'gemini-2.0-flash-exp', 
    name: 'Gemini 2.0 Flash', 
    description: 'Lightning fast responses', 
    contextLength: '1M',
    icon: Zap,
    speed: 'Lightning',
    provider: 'Google'
  },
  { 
    id: 'llama-3.1-70b-versatile', 
    name: 'Llama 3.1 70B', 
    description: 'Open source powerhouse', 
    contextLength: '128k',
    icon: Cpu,
    speed: 'Ultra Fast',
    provider: 'Meta'
  }
];

interface ModelSelectorProps {
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
}

export function ModelSelector({ 
  selectedModel = 'gpt-4-turbo-2024-04-09', 
  onModelChange 
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle body scroll lock on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  const openSheet = () => {
    setIsOpen(true);
    setIsAnimating(true);
  };

  const closeSheet = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  const handleModelSelect = (modelId: string) => {
    onModelChange?.(modelId);
    closeSheet();
  };

  const currentModel = models.find(m => m.id === selectedModel) || models[0];
  const CurrentIcon = currentModel.icon;

  if (isMobile) {
    return (
      <>
        {/* Mobile Trigger Button */}
        <TouchButton
          onClick={openSheet}
          variant="secondary"
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
        >
          <CurrentIcon className="w-4 h-4" />
          <span className="max-w-[120px] truncate">{currentModel.name}</span>
          <ChevronDown className="w-3 h-3" />
        </TouchButton>

        {/* Mobile Bottom Sheet */}
        {isOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
              className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
                isAnimating ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={closeSheet}
            />
            
            {/* Bottom Sheet */}
            <div
              className={`fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl shadow-2xl 
                         transform transition-transform duration-300 ease-out max-h-[70vh] flex flex-col ${
                isAnimating ? 'translate-y-0' : 'translate-y-full'
              }`}
            >
              {/* Sheet Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Select AI Model</h3>
                <TouchButton
                  onClick={closeSheet}
                  variant="ghost"
                  className="min-h-[32px] min-w-[32px] p-2"
                >
                  ✕
                </TouchButton>
              </div>
              
              {/* Model List */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {models.map((model) => {
                    const ModelIcon = model.icon;
                    const isSelected = selectedModel === model.id;
                    
                    return (
                      <TouchButton
                        key={model.id}
                        onClick={() => handleModelSelect(model.id)}
                        variant="ghost"
                        className={cn(
                          "w-full text-left p-4 rounded-xl border-2 transition-all min-h-[auto]",
                          isSelected 
                            ? "border-purple-500 bg-purple-500/10" 
                            : "border-gray-700 hover:border-gray-600 hover:bg-gray-800/50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <ModelIcon className={cn(
                            "w-5 h-5 mt-0.5 flex-shrink-0",
                            isSelected ? "text-purple-400" : "text-gray-400"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "font-medium",
                                isSelected ? "text-purple-300" : "text-white"
                              )}>
                                {model.name}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
                                {model.speed}
                              </span>
                            </div>
                            <div className="text-sm text-gray-400 mt-1">{model.description}</div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <span>{model.contextLength} context</span>
                              <span>•</span>
                              <span>{model.provider}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </TouchButton>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop dropdown implementation
  return (
    <div className="relative">
      <select
        value={selectedModel}
        onChange={(e) => onModelChange?.(e.target.value)}
        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white 
                   focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                   appearance-none cursor-pointer min-w-[180px]"
      >
        {models.map(model => (
          <option key={model.id} value={model.id} className="bg-gray-800">
            {model.name} • {model.speed}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown arrow */}
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}