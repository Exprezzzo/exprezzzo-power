export interface AIModel {
  id: string;
  name: string;
  cost: number; // Cost per 1K tokens
  speed: 'instant' | 'fast' | 'medium' | 'slow';
  context: number; // Context window size
}

export interface AIProviderData {
  name: string;
  icon: string;
  models: AIModel[];
}

export interface AIProvider {
  id: string;
  name: string;
  models: AIModel[];
  icon: string;
  color: string;
}

export const AI_MODELS_2025 = {
  openai: {
    name: 'OpenAI',
    icon: '🧠',
    models: [
      { id: 'gpt-4-turbo-2025-08', name: 'GPT-4 Turbo (Latest)', cost: 0.01, speed: 'fast', context: 128000 },
      { id: 'gpt-4o', name: 'GPT-4 Omni', cost: 0.005, speed: 'fast', context: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4 Omni Mini', cost: 0.00015, speed: 'instant', context: 128000 },
      { id: 'o1-preview', name: 'O1 Preview (Reasoning)', cost: 0.015, speed: 'slow', context: 128000 },
      { id: 'o1-mini', name: 'O1 Mini', cost: 0.003, speed: 'medium', context: 128000 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', cost: 0.0005, speed: 'instant', context: 16385 }
    ]
  },
  anthropic: {
    name: 'Anthropic',
    icon: '🎭',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Oct)', cost: 0.003, speed: 'fast', context: 200000 },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', cost: 0.015, speed: 'medium', context: 200000 },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', cost: 0.00025, speed: 'instant', context: 200000 },
      { id: 'claude-2.1', name: 'Claude 2.1', cost: 0.008, speed: 'medium', context: 200000 }
    ]
  },
  google: {
    name: 'Google',
    icon: '💎',
    models: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental', cost: 0.00015, speed: 'instant', context: 1048576 },
      { id: 'gemini-1.5-pro-002', name: 'Gemini 1.5 Pro', cost: 0.00125, speed: 'fast', context: 2097152 },
      { id: 'gemini-1.5-flash-002', name: 'Gemini 1.5 Flash', cost: 0.000075, speed: 'instant', context: 1048576 }
    ]
  },
  groq: {
    name: 'Groq',
    icon: '⚡',
    models: [
      { id: 'llama-3.1-405b-reasoning', name: 'Llama 3.1 405B', cost: 0.0006, speed: 'medium', context: 131072 },
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', cost: 0.00035, speed: 'fast', context: 131072 },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', cost: 0.00005, speed: 'instant', context: 131072 },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', cost: 0.00024, speed: 'fast', context: 32768 }
    ]
  },
  mistral: {
    name: 'Mistral',
    icon: '🌪️',
    models: [
      { id: 'mistral-large-2411', name: 'Mistral Large 2', cost: 0.002, speed: 'medium', context: 128000 },
      { id: 'mistral-medium-2312', name: 'Mistral Medium', cost: 0.0027, speed: 'fast', context: 32000 },
      { id: 'mistral-small-2409', name: 'Mistral Small', cost: 0.0002, speed: 'instant', context: 32000 }
    ]
  },
  perplexity: {
    name: 'Perplexity',
    icon: '🔍',
    models: [
      { id: 'llama-3.1-sonar-large-128k-online', name: 'Sonar Large (Online)', cost: 0.001, speed: 'medium', context: 128000 },
      { id: 'llama-3.1-sonar-small-128k-online', name: 'Sonar Small (Online)', cost: 0.0002, speed: 'fast', context: 128000 }
    ]
  }
} as const;

// Legacy support - keeping old format for backward compatibility
export const AI_MODELS = {
  openai: AI_MODELS_2025.openai.models,
  anthropic: AI_MODELS_2025.anthropic.models,
  google: AI_MODELS_2025.google.models,
  groq: AI_MODELS_2025.groq.models,
  mistral: AI_MODELS_2025.mistral.models,
  perplexity: AI_MODELS_2025.perplexity.models
} as const;

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: AI_MODELS_2025.openai.name,
    models: AI_MODELS_2025.openai.models,
    icon: AI_MODELS_2025.openai.icon,
    color: 'bg-green-500'
  },
  {
    id: 'anthropic',
    name: AI_MODELS_2025.anthropic.name,
    models: AI_MODELS_2025.anthropic.models,
    icon: AI_MODELS_2025.anthropic.icon,
    color: 'bg-orange-500'
  },
  {
    id: 'google',
    name: AI_MODELS_2025.google.name,
    models: AI_MODELS_2025.google.models,
    icon: AI_MODELS_2025.google.icon,
    color: 'bg-blue-500'
  },
  {
    id: 'groq',
    name: AI_MODELS_2025.groq.name,
    models: AI_MODELS_2025.groq.models,
    icon: AI_MODELS_2025.groq.icon,
    color: 'bg-purple-500'
  },
  {
    id: 'mistral',
    name: AI_MODELS_2025.mistral.name,
    models: AI_MODELS_2025.mistral.models,
    icon: AI_MODELS_2025.mistral.icon,
    color: 'bg-indigo-500'
  },
  {
    id: 'perplexity',
    name: AI_MODELS_2025.perplexity.name,
    models: AI_MODELS_2025.perplexity.models,
    icon: AI_MODELS_2025.perplexity.icon,
    color: 'bg-teal-500'
  }
];

// Helper functions
export const getModelById = (modelId: string): AIModel | undefined => {
  for (const provider of Object.values(AI_MODELS)) {
    const model = provider.find(m => m.id === modelId);
    if (model) return model;
  }
  return undefined;
};

export const getProviderByModelId = (modelId: string): AIProvider | undefined => {
  return AI_PROVIDERS.find(provider => 
    provider.models.some(model => model.id === modelId)
  );
};

export const calculateTokenCost = (tokens: number, modelId: string): number => {
  const model = getModelById(modelId);
  if (!model) return 0;
  return (tokens / 1000) * model.cost;
};

export const formatCost = (cost: number): string => {
  if (cost < 0.001) return `$${(cost * 1000).toFixed(2)}¢`;
  return `$${cost.toFixed(4)}`;
};

// New helper functions for 2025 features
export const getSpeedLabel = (speed: AIModel['speed']): string => {
  const labels = {
    instant: '⚡ Instant',
    fast: '🚀 Fast',
    medium: '🏃 Medium',
    slow: '🐌 Slow'
  };
  return labels[speed];
};

export const getSpeedColor = (speed: AIModel['speed']): string => {
  const colors = {
    instant: 'text-green-500',
    fast: 'text-blue-500',
    medium: 'text-yellow-500',
    slow: 'text-red-500'
  };
  return colors[speed];
};

export const formatContextWindow = (context: number): string => {
  if (context >= 1000000) return `${(context / 1000000).toFixed(1)}M`;
  if (context >= 1000) return `${(context / 1000).toFixed(0)}K`;
  return context.toString();
};

export const getModelsBySpeed = (speed: AIModel['speed']): AIModel[] => {
  return AI_PROVIDERS.flatMap(provider => 
    provider.models.filter(model => model.speed === speed)
  );
};

export const getModelsByProvider = (providerId: string): AIModel[] => {
  const provider = AI_PROVIDERS.find(p => p.id === providerId);
  return provider?.models || [];
};

export const getCheapestModel = (): AIModel | undefined => {
  const allModels = AI_PROVIDERS.flatMap(provider => provider.models);
  return allModels.reduce((cheapest, current) => 
    current.cost < cheapest.cost ? current : cheapest
  );
};

export const getFastestModel = (): AIModel | undefined => {
  const instantModels = getModelsBySpeed('instant');
  return instantModels.length > 0 ? instantModels[0] : undefined;
};

export const getRecommendedModel = (criteria: 'cost' | 'speed' | 'context' = 'cost'): AIModel | undefined => {
  const allModels = AI_PROVIDERS.flatMap(provider => provider.models);
  
  switch (criteria) {
    case 'cost':
      return getCheapestModel();
    case 'speed':
      return getFastestModel();
    case 'context':
      return allModels.reduce((largest, current) => 
        current.context > largest.context ? current : largest
      );
    default:
      return allModels[0];
  }
};