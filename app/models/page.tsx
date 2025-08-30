'use client';

import { useState } from 'react';
import { Zap, Brain, Rocket, Star, Clock, DollarSign, Shield, Sparkles } from 'lucide-react';

const models = [
  {
    id: 'kani',
    name: 'Kani',
    provider: 'EXPREZZZ',
    description: 'Our flagship ultra-fast model optimized for speed and efficiency',
    features: ['Fastest response times', 'Optimized for chat', 'Cost-effective', 'High availability'],
    pricing: {
      input: 2.0,
      output: 2.0,
      direct: 5.0,
      savings: 60
    },
    performance: {
      speed: 95,
      quality: 88,
      cost: 95
    },
    icon: Zap,
    color: 'from-green-500 to-green-600',
    popular: true,
    category: 'speed'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Latest GPT-4 with vision and multimodal capabilities',
    features: ['Vision support', 'Code generation', 'Multimodal', 'Latest training'],
    pricing: {
      input: 18.0,
      output: 18.0,
      direct: 30.0,
      savings: 40
    },
    performance: {
      speed: 75,
      quality: 95,
      cost: 65
    },
    icon: Brain,
    color: 'from-blue-500 to-blue-600',
    popular: false,
    category: 'quality'
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Advanced reasoning with superior code understanding',
    features: ['Advanced reasoning', 'Code expertise', 'Long context', 'Safety focused'],
    pricing: {
      input: 8.0,
      output: 8.0,
      direct: 15.0,
      savings: 47
    },
    performance: {
      speed: 80,
      quality: 93,
      cost: 75
    },
    icon: Sparkles,
    color: 'from-purple-500 to-purple-600',
    popular: false,
    category: 'quality'
  },
  {
    id: 'command-r-plus',
    name: 'Command R+',
    provider: 'Cohere',
    description: 'Enterprise-grade model with retrieval augmentation',
    features: ['Retrieval augmented', 'Enterprise ready', 'Multi-language', 'Tool use'],
    pricing: {
      input: 1.5,
      output: 1.5,
      direct: 3.0,
      savings: 50
    },
    performance: {
      speed: 85,
      quality: 85,
      cost: 85
    },
    icon: Rocket,
    color: 'from-orange-500 to-orange-600',
    popular: false,
    category: 'balanced'
  }
];

const categories = [
  { id: 'all', name: 'All Models', icon: Star },
  { id: 'speed', name: 'Speed Optimized', icon: Zap },
  { id: 'quality', name: 'Quality Focused', icon: Brain },
  { id: 'balanced', name: 'Balanced', icon: Shield }
];

export default function ModelsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const filteredModels = selectedCategory === 'all' 
    ? models 
    : models.filter(model => model.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate-dark via-chocolate-darker to-black text-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
              AI Models
            </span>
            <br />
            <span className="text-3xl md:text-4xl text-gray-300">
              40-60% Cheaper
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Access the world's most advanced AI models through our intelligent routing system. 
            Same quality, dramatically lower costs.
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-400" />
              <span>Real-time routing</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-gold" />
              <span>Pay per token</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span>Enterprise security</span>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center mb-12">
          <div className="flex space-x-2 bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-gold text-black font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-chocolate-surface/30'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-sm">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20">
          {filteredModels.map((model) => {
            const IconComponent = model.icon;
            return (
              <div
                key={model.id}
                className={`relative bg-chocolate-surface/20 backdrop-blur-sm border rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer ${
                  selectedModel === model.id
                    ? 'border-gold shadow-xl shadow-gold/20 ring-2 ring-gold/30'
                    : model.popular
                    ? 'border-gold/50 shadow-lg shadow-gold/10'
                    : 'border-chocolate-surface/30 hover:border-chocolate-surface/60'
                }`}
                onClick={() => setSelectedModel(selectedModel === model.id ? null : model.id)}
              >
                {model.popular && (
                  <div className="absolute -top-4 left-8">
                    <div className="bg-gradient-to-r from-gold to-gold-dark text-black px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>Fastest</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${model.color} flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{model.name}</h3>
                      <p className="text-sm text-gray-400">{model.provider}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-gold text-black px-2 py-1 rounded text-xs font-bold">
                      {model.pricing.savings}% OFF
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-6">{model.description}</p>

                {/* Performance Bars */}
                <div className="space-y-3 mb-6">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Speed</span>
                      <span>{model.performance.speed}%</span>
                    </div>
                    <div className="h-2 bg-chocolate-surface rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                        style={{ width: `${model.performance.speed}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Quality</span>
                      <span>{model.performance.quality}%</span>
                    </div>
                    <div className="h-2 bg-chocolate-surface rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                        style={{ width: `${model.performance.quality}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Cost Efficiency</span>
                      <span>{model.performance.cost}%</span>
                    </div>
                    <div className="h-2 bg-chocolate-surface rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-gold to-gold-dark transition-all duration-500"
                        style={{ width: `${model.performance.cost}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {model.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                      <span className="text-xs text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="border-t border-chocolate-surface/30 pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Our Price</p>
                      <p className="text-lg font-bold text-green-400">
                        ${model.pricing.input.toFixed(1)}/1M tokens
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">Direct API</p>
                      <p className="text-sm text-red-300 line-through">
                        ${model.pricing.direct.toFixed(1)}/1M tokens
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedModel === model.id && (
                  <div className="border-t border-chocolate-surface/30 pt-6 mt-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gold mb-3">Use Cases</h4>
                        <ul className="space-y-2 text-sm text-gray-300">
                          {model.id === 'kani' && (
                            <>
                              <li>• Real-time chat applications</li>
                              <li>• High-frequency API calls</li>
                              <li>• Cost-sensitive projects</li>
                              <li>• Rapid prototyping</li>
                            </>
                          )}
                          {model.id === 'gpt-4o' && (
                            <>
                              <li>• Complex reasoning tasks</li>
                              <li>• Image analysis & vision</li>
                              <li>• Creative writing</li>
                              <li>• Advanced code generation</li>
                            </>
                          )}
                          {model.id === 'claude-3.5-sonnet' && (
                            <>
                              <li>• Code review & debugging</li>
                              <li>• Technical documentation</li>
                              <li>• Long-form content</li>
                              <li>• Safety-critical applications</li>
                            </>
                          )}
                          {model.id === 'command-r-plus' && (
                            <>
                              <li>• Enterprise applications</li>
                              <li>• Multi-language support</li>
                              <li>• Knowledge retrieval</li>
                              <li>• Tool integration</li>
                            </>
                          )}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gold mb-3">Specifications</h4>
                        <div className="space-y-2 text-sm text-gray-300">
                          <div className="flex justify-between">
                            <span>Context Window:</span>
                            <span>
                              {model.id === 'kani' && '32K tokens'}
                              {model.id === 'gpt-4o' && '128K tokens'}
                              {model.id === 'claude-3.5-sonnet' && '200K tokens'}
                              {model.id === 'command-r-plus' && '128K tokens'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Training Data:</span>
                            <span>
                              {model.id === 'kani' && '2024'}
                              {model.id === 'gpt-4o' && '2024'}
                              {model.id === 'claude-3.5-sonnet' && '2024'}
                              {model.id === 'command-r-plus' && '2024'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Response Speed:</span>
                            <span>
                              {model.id === 'kani' && '~200ms'}
                              {model.id === 'gpt-4o' && '~800ms'}
                              {model.id === 'claude-3.5-sonnet' && '~600ms'}
                              {model.id === 'command-r-plus' && '~500ms'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-gold/10 to-gold-dark/10 border border-gold/20 rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">
              Ready to start using these models?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Get instant access to all models with pay-per-token pricing
            </p>
            <div className="flex items-center justify-center space-x-4">
              <a
                href="/register"
                className="bg-gradient-to-r from-gold to-gold-dark text-black px-8 py-4 rounded-lg font-semibold text-lg hover:from-gold-dark hover:to-gold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Building
              </a>
              <a
                href="/chat"
                className="border border-gold text-gold px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gold hover:text-black transition-all duration-200"
              >
                Try Demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}