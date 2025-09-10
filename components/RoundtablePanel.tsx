'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, DollarSign, Clock, Zap, RotateCcw } from 'lucide-react';

interface ModelResponse {
  model: string;
  provider: string;
  response: string;
  responseTime: number; // in seconds
  cost: number; // in dollars
  tokens: number;
  status: 'completed' | 'loading' | 'error';
  error?: string;
  votes: number;
}

interface RoundtablePanelProps {
  prompt: string;
  models: string[];
  onRetry?: () => void;
}

export default function RoundtablePanel({ prompt, models, onRetry }: RoundtablePanelProps) {
  const [responses, setResponses] = useState<ModelResponse[]>([
    {
      model: 'GPT-4 Turbo',
      provider: 'OpenAI',
      response: 'This is a comprehensive analysis of the topic. The key points to consider are: 1) The fundamental approach should prioritize accuracy over speed, 2) Implementation requires careful consideration of edge cases, and 3) Testing should be thorough and cover multiple scenarios.',
      responseTime: 2.3,
      cost: 0.045,
      tokens: 856,
      status: 'completed',
      votes: 3,
    },
    {
      model: 'Claude 3 Sonnet',
      provider: 'Anthropic',
      response: 'Looking at this from multiple angles, I\'d recommend starting with a structured approach: Begin by defining clear objectives, then develop a methodology that addresses both immediate needs and long-term goals. Consider scalability from the outset.',
      responseTime: 1.8,
      cost: 0.032,
      tokens: 642,
      status: 'completed',
      votes: 5,
    },
    {
      model: 'Gemini Pro',
      provider: 'Google',
      response: 'Based on current best practices and industry standards, the optimal solution would involve a multi-layered strategy. This ensures robustness while maintaining efficiency and cost-effectiveness.',
      responseTime: 1.5,
      cost: 0.008,
      tokens: 423,
      status: 'completed',
      votes: 1,
    },
    {
      model: 'GPT-3.5 Turbo',
      provider: 'OpenAI',
      response: 'Here\'s a practical approach to solve this problem: Focus on the core requirements first, then iterate and improve. This method has proven effective in similar scenarios.',
      responseTime: 0.9,
      cost: 0.002,
      tokens: 287,
      status: 'completed',
      votes: 2,
    },
  ]);

  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set(models));
  const [sortBy, setSortBy] = useState<'votes' | 'cost' | 'speed' | 'model'>('votes');

  const handleVote = (modelIndex: number, voteType: 'up' | 'down') => {
    setResponses(prev => prev.map((response, index) => 
      index === modelIndex 
        ? { ...response, votes: response.votes + (voteType === 'up' ? 1 : -1) }
        : response
    ));
  };

  const sortedResponses = [...responses].sort((a, b) => {
    switch (sortBy) {
      case 'votes':
        return b.votes - a.votes;
      case 'cost':
        return a.cost - b.cost;
      case 'speed':
        return a.responseTime - b.responseTime;
      case 'model':
        return a.model.localeCompare(b.model);
      default:
        return 0;
    }
  });

  const totalCost = responses.reduce((sum, r) => sum + r.cost, 0);
  const avgResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;
  const fastestModel = responses.reduce((fastest, current) => 
    current.responseTime < fastest.responseTime ? current : fastest
  );
  const cheapestModel = responses.reduce((cheapest, current) => 
    current.cost < cheapest.cost ? current : cheapest
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Roundtable Results</h3>
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-3 py-1 text-vegas-gold hover:text-vegas-gold-light text-sm"
          >
            <RotateCcw size={16} />
            Retry All
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-muted text-sm">Total Cost</p>
            <p className="text-vegas-gold font-semibold">${totalCost.toFixed(4)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted text-sm">Avg Speed</p>
            <p className="text-white font-semibold">{avgResponseTime.toFixed(1)}s</p>
          </div>
          <div className="text-center">
            <p className="text-muted text-sm">Fastest</p>
            <p className="text-white font-semibold">{fastestModel.model}</p>
          </div>
          <div className="text-center">
            <p className="text-muted text-sm">Cheapest</p>
            <p className="text-white font-semibold">{cheapestModel.model}</p>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2 mb-4">
          <span className="text-muted text-sm">Sort by:</span>
          {[
            { value: 'votes', label: 'Votes' },
            { value: 'cost', label: 'Cost' },
            { value: 'speed', label: 'Speed' },
            { value: 'model', label: 'Model' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value as any)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortBy === option.value
                  ? 'bg-vegas-gold text-bg-dark'
                  : 'text-muted hover:text-vegas-gold'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Model Responses */}
      <div className="space-y-4">
        {sortedResponses.map((response, index) => (
          <div
            key={response.model}
            className={`surface rounded-xl p-6 backdrop-blur-sm border transition-all ${
              response.model === fastestModel.model
                ? 'border-blue-400/30 bg-blue-400/5'
                : response.model === cheapestModel.model
                ? 'border-green-400/30 bg-green-400/5'
                : 'border-gold/20'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h4 className="text-lg font-semibold text-white">{response.model}</h4>
                <span className="text-muted text-sm">by {response.provider}</span>
                {response.model === fastestModel.model && (
                  <span className="px-2 py-1 bg-blue-400/20 text-blue-300 text-xs rounded-full">
                    Fastest
                  </span>
                )}
                {response.model === cheapestModel.model && (
                  <span className="px-2 py-1 bg-green-400/20 text-green-300 text-xs rounded-full">
                    Cheapest
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                {/* Performance Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="text-vegas-gold" size={14} />
                    <span className="text-muted">{response.responseTime}s</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="text-vegas-gold" size={14} />
                    <span className="text-muted">${response.cost.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="text-vegas-gold" size={14} />
                    <span className="text-muted">{response.tokens} tokens</span>
                  </div>
                </div>

                {/* Voting */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVote(responses.indexOf(response), 'up')}
                    className="p-1 hover:bg-vegas-gold/20 rounded"
                  >
                    <ChevronUp className="text-vegas-gold" size={16} />
                  </button>
                  <span className="text-white font-semibold w-6 text-center">{response.votes}</span>
                  <button
                    onClick={() => handleVote(responses.indexOf(response), 'down')}
                    className="p-1 hover:bg-vegas-gold/20 rounded"
                  >
                    <ChevronDown className="text-vegas-gold" size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="text-white leading-relaxed">{response.response}</p>
            </div>

            {response.status === 'loading' && (
              <div className="mt-4 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vegas-gold"></div>
                <span className="text-muted text-sm">Generating response...</span>
              </div>
            )}

            {response.status === 'error' && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{response.error || 'Failed to generate response'}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comparison Summary */}
      <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
        <h3 className="text-lg font-semibold text-white mb-4">Response Analysis</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-white mb-3">Performance Comparison</h4>
            <div className="space-y-2">
              {responses.map((response) => (
                <div key={response.model} className="flex items-center justify-between">
                  <span className="text-muted text-sm">{response.model}</span>
                  <div className="flex gap-4 text-sm">
                    <span className="text-vegas-gold">{response.responseTime}s</span>
                    <span className="text-green-400">${response.cost.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Community Preference</h4>
            <div className="space-y-2">
              {sortedResponses.slice(0, 3).map((response, index) => (
                <div key={response.model} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    index === 0 ? 'bg-vegas-gold text-bg-dark' :
                    index === 1 ? 'bg-gray-400 text-bg-dark' :
                    'bg-amber-600 text-bg-dark'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-white text-sm">{response.model}</span>
                  <span className="text-vegas-gold text-sm">({response.votes} votes)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}