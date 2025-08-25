export const AI_MODELS = {
  openai: [
    { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', cost: 0.01 },
    { id: 'gpt-4-1106-preview', name: 'GPT-4.1 Preview', cost: 0.01 },
    { id: 'gpt-4o', name: 'GPT-4 Omni', cost: 0.005 },
    { id: 'gpt-4o-mini', name: 'GPT-4 Omni Mini', cost: 0.00015 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', cost: 0.0005 }
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', cost: 0.003 },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', cost: 0.015 },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', cost: 0.00025 },
    { id: 'claude-4-1', name: 'Claude 4.1 (Latest)', cost: 0.02 }
  ],
  google: [
    { id: 'gemini-2-0-pro', name: 'Gemini 2.0 Pro', cost: 0.00125 },
    { id: 'gemini-1-5-pro', name: 'Gemini 1.5 Pro', cost: 0.00125 },
    { id: 'gemini-1-5-flash', name: 'Gemini 1.5 Flash', cost: 0.000075 }
  ],
  groq: [
    { id: 'llama-3-1-405b', name: 'Llama 3.1 405B', cost: 0.0006 },
    { id: 'llama-3-1-70b', name: 'Llama 3.1 70B', cost: 0.00035 },
    { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', cost: 0.00024 }
  ],
  mistral: [
    { id: 'mistral-large', name: 'Mistral Large', cost: 0.002 },
    { id: 'mistral-medium', name: 'Mistral Medium', cost: 0.0027 }
  ],
  perplexity: [
    { id: 'pplx-70b-online', name: 'Perplexity 70B Online', cost: 0.001 }
  ]
};
