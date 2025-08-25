// components/RoundtableView.tsx
// Responsive Roundtable interface with Vegas-themed design and confetti animations

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ModelId, RoundtableResult, RoundtableResponse } from '@/types/ai-playground';
import ModelResponse from './ModelResponse';
import ModelSelector from './ModelSelector';
import RoundtableResults from './RoundtableResults';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import confetti from 'canvas-confetti';

interface RoundtableViewProps {
  isActive: boolean;
  onClose: () => void;
  className?: string;
}

interface RoundtableState {
  selectedModels: ModelId[];
  prompt: string;
  responses: Map<ModelId, RoundtableResponse>;
  isExecuting: boolean;
  executionStartTime: number | null;
  completedModels: Set<ModelId>;
  syncIndicators: Map<ModelId, 'waiting' | 'executing' | 'streaming' | 'completed' | 'error'>;
  results: RoundtableResult | null;
  showResults: boolean;
}

const RoundtableView: React.FC<RoundtableViewProps> = ({
  isActive,
  onClose,
  className = ''
}) => {
  const [state, setState] = useState<RoundtableState>({
    selectedModels: [],
    prompt: '',
    responses: new Map(),
    isExecuting: false,
    executionStartTime: null,
    completedModels: new Set(),
    syncIndicators: new Map(),
    results: null,
    showResults: false
  });

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isMobile = useMediaQuery('(max-width: 767px)');

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (promptTextareaRef.current) {
      promptTextareaRef.current.style.height = 'auto';
      promptTextareaRef.current.style.height = `${promptTextareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [state.prompt, adjustTextareaHeight]);

  // Initialize sync indicators when models change
  useEffect(() => {
    const newIndicators = new Map();
    state.selectedModels.forEach(model => {
      newIndicators.set(model, 'waiting' as const);
    });
    setState(prev => ({ ...prev, syncIndicators: newIndicators }));
  }, [state.selectedModels]);

  // Check for unanimous agreement and trigger confetti
  useEffect(() => {
    if (state.completedModels.size === state.selectedModels.length && 
        state.selectedModels.length >= 2 &&
        state.responses.size === state.selectedModels.length) {
      
      const responses = Array.from(state.responses.values());
      const isUnanimous = checkUnanimousAgreement(responses);
      
      if (isUnanimous) {
        triggerConfetti();
      }
    }
  }, [state.completedModels, state.responses, state.selectedModels.length]);

  const handleModelSelection = (models: ModelId[]) => {
    if (!state.isExecuting) {
      setState(prev => ({ 
        ...prev, 
        selectedModels: models,
        responses: new Map(),
        completedModels: new Set(),
        results: null,
        showResults: false
      }));
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({ ...prev, prompt: e.target.value }));
  };

  const executeRoundtable = async () => {
    if (state.selectedModels.length < 2 || !state.prompt.trim()) {
      return;
    }

    setState(prev => ({
      ...prev,
      isExecuting: true,
      executionStartTime: Date.now(),
      responses: new Map(),
      completedModels: new Set(),
      results: null,
      showResults: false
    }));

    try {
      const response = await fetch('/api/roundtable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: state.prompt,
          models: state.selectedModels,
          settings: {
            temperature: 0.7,
            maxTokens: 2048
          },
          includeVoting: true
        })
      });

      if (!response.ok) {
        throw new Error('Roundtable execution failed');
      }

      // Set up streaming response handling
      await handleStreamingRoundtable(response);

    } catch (error) {
      console.error('Roundtable execution failed:', error);
      setState(prev => ({
        ...prev,
        isExecuting: false,
        executionStartTime: null
      }));
    }
  };

  const handleStreamingRoundtable = async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              handleStreamingUpdate(data);
            } catch (e) {
              console.error('Failed to parse streaming data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  const handleStreamingUpdate = (data: any) => {
    switch (data.type) {
      case 'model_start':
        setState(prev => ({
          ...prev,
          syncIndicators: new Map(prev.syncIndicators.set(data.modelId, 'executing'))
        }));
        break;

      case 'model_streaming':
        setState(prev => ({
          ...prev,
          syncIndicators: new Map(prev.syncIndicators.set(data.modelId, 'streaming')),
          responses: new Map(prev.responses.set(data.modelId, {
            ...prev.responses.get(data.modelId),
            content: data.content,
            isStreaming: true
          } as RoundtableResponse))
        }));
        break;

      case 'model_complete':
        setState(prev => ({
          ...prev,
          syncIndicators: new Map(prev.syncIndicators.set(data.modelId, 'completed')),
          completedModels: new Set(prev.completedModels.add(data.modelId)),
          responses: new Map(prev.responses.set(data.modelId, data.response))
        }));
        break;

      case 'model_error':
        setState(prev => ({
          ...prev,
          syncIndicators: new Map(prev.syncIndicators.set(data.modelId, 'error'))
        }));
        break;

      case 'roundtable_complete':
        setState(prev => ({
          ...prev,
          isExecuting: false,
          executionStartTime: null,
          results: data.result,
          showResults: true
        }));
        break;
    }
  };

  const checkUnanimousAgreement = (responses: RoundtableResponse[]): boolean => {
    if (responses.length < 2) return false;
    
    // Simple check for similar responses (would use embedding similarity in production)
    const firstResponse = responses[0].content.toLowerCase().trim();
    return responses.every(response => {
      const similarity = calculateSimilarity(firstResponse, response.content.toLowerCase().trim());
      return similarity > 0.8;
    });
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  };

  const triggerConfetti = () => {
    // Vegas-style gold confetti animation
    const colors = ['#FFD700', '#FFA500', '#FF6B35', '#B8860B'];
    
    const fireConfetti = (origin: { x: number; y: number }) => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin,
        colors,
        shapes: ['star', 'circle'],
        scalar: 1.2,
        drift: 1,
        gravity: 0.8,
        ticks: 300
      });
    };

    // Fire from multiple positions
    fireConfetti({ x: 0.2, y: 0.6 });
    fireConfetti({ x: 0.8, y: 0.6 });
    
    setTimeout(() => {
      fireConfetti({ x: 0.5, y: 0.4 });
    }, 300);
  };

  // Mobile swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMobile) {
      setSwipeStartX(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isMobile && swipeStartX !== null) {
      const currentX = e.touches[0].clientX;
      const diff = currentX - swipeStartX;
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (isMobile && swipeStartX !== null && Math.abs(dragOffset) > 50) {
      if (dragOffset > 0 && activeTabIndex > 0) {
        setActiveTabIndex(prev => prev - 1);
      } else if (dragOffset < 0 && activeTabIndex < state.selectedModels.length - 1) {
        setActiveTabIndex(prev => prev + 1);
      }
    }
    setSwipeStartX(null);
    setDragOffset(0);
  };

  const renderPromptInput = () => (
    <div className="glass-card p-6 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-vegas-gradient">🎭 Roundtable Mode</h2>
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--vegas-gold)] transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <ModelSelector
          selectedModels={state.selectedModels}
          onSelectionChange={handleModelSelection}
          mode="multi"
          showCostPreview
          disabled={state.isExecuting}
        />

        <div className="relative">
          <textarea
            ref={promptTextareaRef}
            value={state.prompt}
            onChange={handlePromptChange}
            placeholder="Ask a question to compare responses from multiple AI models..."
            className="input-vegas w-full min-h-[100px] resize-none"
            disabled={state.isExecuting}
            rows={3}
          />
          
          <div className="flex items-center justify-between mt-3">
            <div className="text-sm text-[var(--text-muted)]">
              {state.selectedModels.length} models selected
            </div>
            
            <button
              onClick={executeRoundtable}
              disabled={state.isExecuting || state.selectedModels.length < 2 || !state.prompt.trim()}
              className="btn-vegas-primary"
            >
              {state.isExecuting ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--vegas-black)]"></div>
                  Executing...
                </span>
              ) : (
                '🚀 Start Roundtable'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSyncIndicators = () => (
    <div className="glass-card p-4 mb-4 animate-fade-in">
      <div className="flex items-center gap-4 overflow-x-auto">
        <span className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
          Execution Status:
        </span>
        {state.selectedModels.map(model => {
          const status = state.syncIndicators.get(model) || 'waiting';
          const statusConfig = {
            waiting: { color: 'text-gray-400', icon: '⏳', label: 'Waiting' },
            executing: { color: 'text-blue-400', icon: '🔄', label: 'Starting' },
            streaming: { color: 'text-green-400', icon: '📡', label: 'Streaming' },
            completed: { color: 'text-[var(--vegas-gold)]', icon: '✅', label: 'Complete' },
            error: { color: 'text-red-400', icon: '❌', label: 'Error' }
          };

          const config = statusConfig[status];
          
          return (
            <div key={model} className="flex items-center gap-2 whitespace-nowrap">
              <span className={`${config.color} transition-colors`}>
                {config.icon}
              </span>
              <span className="text-sm font-mono">{model}</span>
              <span className={`text-xs ${config.color}`}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDesktopLayout = () => (
    <div className="grid grid-cols-3 gap-4">
      {state.selectedModels.map((model, index) => {
        const response = state.responses.get(model);
        const status = state.syncIndicators.get(model) || 'waiting';
        
        return (
          <div key={model} className="animate-slide-in-right" style={{ animationDelay: `${index * 100}ms` }}>
            <ModelResponse
              modelId={model}
              response={response}
              status={status}
              onVote={(vote) => console.log(`Vote for ${model}:`, vote)}
              showRanking={state.showResults}
            />
          </div>
        );
      })}
    </div>
  );

  const renderTabletLayout = () => (
    <div 
      ref={scrollContainerRef}
      className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {state.selectedModels.map((model, index) => {
        const response = state.responses.get(model);
        const status = state.syncIndicators.get(model) || 'waiting';
        
        return (
          <div 
            key={model} 
            className="flex-shrink-0 w-96 snap-start animate-slide-in-right"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <ModelResponse
              modelId={model}
              response={response}
              status={status}
              onVote={(vote) => console.log(`Vote for ${model}:`, vote)}
              showRanking={state.showResults}
            />
          </div>
        );
      })}
    </div>
  );

  const renderMobileLayout = () => (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="glass-card p-2">
        <div className="flex overflow-x-auto gap-2" style={{ scrollbarWidth: 'none' }}>
          {state.selectedModels.map((model, index) => {
            const status = state.syncIndicators.get(model) || 'waiting';
            const isActive = index === activeTabIndex;
            
            return (
              <button
                key={model}
                onClick={() => setActiveTabIndex(index)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-[var(--vegas-gold)] text-[var(--vegas-black)]' 
                    : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">{model}</span>
                  <StatusDot status={status} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div 
        ref={tabContainerRef}
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex transition-transform duration-300 ease-out"
          style={{ 
            transform: `translateX(${-activeTabIndex * 100 + (dragOffset / window.innerWidth) * 100}%)`,
            width: `${state.selectedModels.length * 100}%`
          }}
        >
          {state.selectedModels.map((model, index) => {
            const response = state.responses.get(model);
            const status = state.syncIndicators.get(model) || 'waiting';
            
            return (
              <div key={model} className="w-full flex-shrink-0 px-1">
                <ModelResponse
                  modelId={model}
                  response={response}
                  status={status}
                  onVote={(vote) => console.log(`Vote for ${model}:`, vote)}
                  showRanking={state.showResults}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Swipe Indicators */}
      {state.selectedModels.length > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          {state.selectedModels.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === activeTabIndex ? 'bg-[var(--vegas-gold)]' : 'bg-[var(--glass-border)]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  const StatusDot: React.FC<{ status: string }> = ({ status }) => {
    const colors = {
      waiting: 'bg-gray-400',
      executing: 'bg-blue-400 animate-pulse',
      streaming: 'bg-green-400 animate-pulse',
      completed: 'bg-[var(--vegas-gold)]',
      error: 'bg-red-400'
    };

    return (
      <div className={`w-2 h-2 rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-400'}`} />
    );
  };

  if (!isActive) return null;

  return (
    <div className={`h-full bg-vegas-gradient overflow-y-auto ${className}`}>
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {renderPromptInput()}
        
        {state.isExecuting && renderSyncIndicators()}
        
        {state.selectedModels.length > 0 && (
          <>
            {isDesktop && renderDesktopLayout()}
            {isTablet && renderTabletLayout()}
            {isMobile && renderMobileLayout()}
          </>
        )}

        {state.showResults && state.results && (
          <RoundtableResults
            result={state.results}
            responses={Array.from(state.responses.values())}
            onExport={(format) => console.log('Export:', format)}
            onShare={() => console.log('Share roundtable')}
          />
        )}
      </div>
    </div>
  );
};

export default RoundtableView;