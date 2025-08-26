export const AI_MODELS_2025 = {
  'gpt-4-turbo-2024-04-09': {
    name: 'GPT-4 Turbo',
    provider: 'openai',
    contextWindow: 128000,
    maxOutput: 4096,
    speed: 'Fast',
    cost: 'High'
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128000,
    maxOutput: 16384,
    speed: 'Very Fast',
    cost: 'Low'
  },
  'claude-3-5-sonnet-20241022': {
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutput: 8192,
    speed: 'Fast',
    cost: 'Medium'
  },
  'gemini-2.0-flash-exp': {
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    contextWindow: 1048576,
    maxOutput: 8192,
    speed: 'Lightning',
    cost: 'Very Low'
  },
  'llama-3.1-70b-versatile': {
    name: 'Llama 3.1 70B',
    provider: 'groq',
    contextWindow: 131072,
    maxOutput: 8000,
    speed: 'Ultra Fast',
    cost: 'Free'
  }
};