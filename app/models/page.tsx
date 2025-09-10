'use client';

import { useState } from 'react';
import { Zap, Clock, DollarSign, Star, Filter } from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  category: 'text' | 'image' | 'code' | 'multimodal';
  costPer1k: number;
  speed: number; // tokens per second
  quality: number; // 1-5 rating
  capabilities: string[];
  contextWindow: string;
  popular: boolean;
}

const aiModels: AIModel[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    category: 'text',
    costPer1k: 0.030,
    speed: 85,
    quality: 5,
    capabilities: ['Text Generation', 'Code', 'Analysis', 'Creative Writing'],
    contextWindow: '128K tokens',
    popular: true,
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    category: 'text',
    costPer1k: 0.015,
    speed: 92,
    quality: 5,
    capabilities: ['Text Generation', 'Analysis', 'Math', 'Coding'],
    contextWindow: '200K tokens',
    popular: true,
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    category: 'multimodal',
    costPer1k: 0.0005,
    speed: 78,
    quality: 4,
    capabilities: ['Text', 'Images', 'Video', 'Audio'],
    contextWindow: '32K tokens',
    popular: false,
  },
  {
    id: 'llama-2-70b',
    name: 'Llama 2 70B',
    provider: 'Meta',
    category: 'text',
    costPer1k: 0.00065,
    speed: 45,
    quality: 4,
    capabilities: ['Text Generation', 'Code', 'Open Source'],
    contextWindow: '4K tokens',
    popular: false,
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    category: 'image',
    costPer1k: 40.0,
    speed: 15,
    quality: 5,
    capabilities: ['Image Generation', 'Art Creation', 'Photo Realistic'],
    contextWindow: 'N/A',
    popular: true,
  },
  {
    id: 'midjourney-v6',
    name: 'Midjourney v6',
    provider: 'Midjourney',
    category: 'image',
    costPer1k: 30.0,
    speed: 12,
    quality: 5,
    capabilities: ['Artistic Images', 'Style Transfer', 'Creative Art'],
    contextWindow: 'N/A',
    popular: true,
  },
];

export default function ModelsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'speed' | 'quality'>('name');

  const categories = [
    { value: 'all', label: 'All Models' },
    { value: 'text', label: 'Text Generation' },
    { value: 'image', label: 'Image Generation' },
    { value: 'code', label: 'Code Generation' },
    { value: 'multimodal', label: 'Multimodal' },
  ];

  const filteredModels = aiModels
    .filter(model => selectedCategory === 'all' || model.category === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'cost':
          return a.costPer1k - b.costPer1k;
        case 'speed':
          return b.speed - a.speed;
        case 'quality':
          return b.quality - a.quality;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const getCostLabel = (cost: number, category: string) => {
    if (category === 'image') {
      return `$${cost}/image`;
    }
    return `$${cost}/1K tokens`;
  };

  const getQualityStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'text-vegas-gold fill-current' : 'text-gray-400'}
      />
    ));
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gold-gradient-text mb-4">
            AI Model Directory
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Compare capabilities, pricing, and performance across all major AI providers.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="text-vegas-gold" size={20} />
            <span className="text-muted">Filter:</span>
          </div>
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedCategory === category.value
                  ? 'border-vegas-gold bg-vegas-gold/10 text-vegas-gold'
                  : 'border-gold/20 text-muted hover:border-vegas-gold'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="flex gap-4 mb-8">
          <span className="text-muted">Sort by:</span>
          {[
            { value: 'name', label: 'Name' },
            { value: 'cost', label: 'Cost' },
            { value: 'speed', label: 'Speed' },
            { value: 'quality', label: 'Quality' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value as any)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortBy === option.value
                  ? 'text-vegas-gold'
                  : 'text-muted hover:text-vegas-gold'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Models Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              className={`relative surface rounded-xl p-6 backdrop-blur-sm border transition-all hover:border-vegas-gold/50 ${
                model.popular ? 'border-vegas-gold/30' : 'border-gold/20'
              }`}
            >
              {model.popular && (
                <div className="absolute -top-2 -right-2">
                  <span className="bg-vegas-gold text-bg-dark px-2 py-1 rounded-full text-xs font-semibold">
                    Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white mb-1">{model.name}</h3>
                <p className="text-muted text-sm">{model.provider}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="text-vegas-gold" size={16} />
                    <span className="text-muted text-sm">Cost</span>
                  </div>
                  <span className="text-white font-semibold">
                    {getCostLabel(model.costPer1k, model.category)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="text-vegas-gold" size={16} />
                    <span className="text-muted text-sm">Speed</span>
                  </div>
                  <span className="text-white">{model.speed} tok/s</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="text-vegas-gold" size={16} />
                    <span className="text-muted text-sm">Quality</span>
                  </div>
                  <div className="flex gap-1">
                    {getQualityStars(model.quality)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="text-vegas-gold" size={16} />
                    <span className="text-muted text-sm">Context</span>
                  </div>
                  <span className="text-white text-sm">{model.contextWindow}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-white mb-2">Capabilities</h4>
                <div className="flex flex-wrap gap-1">
                  {model.capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="px-2 py-1 bg-bg-dark-secondary text-desert-sand text-xs rounded"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>

              <button className="w-full btn-vegas-gold">
                Try Now
              </button>
            </div>
          ))}
        </div>

        {filteredModels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted text-lg">No models found matching your criteria.</p>
          </div>
        )}

        {/* Integration Info */}
        <div className="mt-16 surface rounded-xl p-8 backdrop-blur-sm border border-gold/20 text-center">
          <h2 className="text-2xl font-semibold gold-gradient-text mb-4">
            Unified API Access
          </h2>
          <p className="text-muted mb-6 max-w-2xl mx-auto">
            All models available through a single API endpoint. Switch between providers seamlessly 
            without changing your code. Automatic failover and cost optimization included.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-3 py-1 bg-vegas-gold/10 text-vegas-gold rounded text-sm">
              ✓ Single API Key
            </span>
            <span className="px-3 py-1 bg-vegas-gold/10 text-vegas-gold rounded text-sm">
              ✓ Automatic Failover
            </span>
            <span className="px-3 py-1 bg-vegas-gold/10 text-vegas-gold rounded text-sm">
              ✓ Cost Optimization
            </span>
            <span className="px-3 py-1 bg-vegas-gold/10 text-vegas-gold rounded text-sm">
              ✓ Real-time Monitoring
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
