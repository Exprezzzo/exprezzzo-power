import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

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

interface AIProvider {
  id: string;
  name: string;
  client: any;
  models: typeof AI_MODELS[keyof typeof AI_MODELS];
}

class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private initialized = false;

  constructor() {
    if (!this.initialized) {
      this.initializeProviders();
      this.initialized = true;
    }
  }

  private initializeProviders() {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      const openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.providers.set('openai', {
        id: 'openai',
        name: 'OpenAI',
        client: openaiClient,
        models: AI_MODELS.openai
      });
    }

    // Initialize Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      this.providers.set('anthropic', {
        id: 'anthropic',
        name: 'Anthropic',
        client: anthropicClient,
        models: AI_MODELS.anthropic
      });
    }

    // Initialize Google Gemini
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY) {
      const geminiClient = new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || ''
      );
      this.providers.set('gemini', {
        id: 'gemini',
        name: 'Google Gemini',
        client: geminiClient,
        models: AI_MODELS.google
      });
    }

    // Initialize Groq
    if (process.env.GROQ_API_KEY) {
      const groqClient = new Groq({
        apiKey: process.env.GROQ_API_KEY
      });
      this.providers.set('groq', {
        id: 'groq',
        name: 'Groq',
        client: groqClient,
        models: AI_MODELS.groq
      });
    }
  }

  getProvider(providerId: string): AIProvider | null {
    return this.providers.get(providerId) || null;
  }

  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  getProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }

  hasProvider(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  getProviderCount(): number {
    return this.providers.size;
  }
}

// Export singleton instance
let aiProviderManagerInstance: AIProviderManager | null = null;

export function getAIProviderManager(): AIProviderManager {
  if (!aiProviderManagerInstance) {
    aiProviderManagerInstance = new AIProviderManager();
  }
  return aiProviderManagerInstance;
}

// Helper function to get a specific provider client
export function getProviderClient(providerId: string): any {
  const manager = getAIProviderManager();
  const provider = manager.getProvider(providerId);
  return provider ? provider.client : null;
}

// Helper function to check if providers are configured
export function checkProvidersStatus(): {
  configured: string[];
  missing: string[];
  total: number;
} {
  const manager = getAIProviderManager();
  const configured = manager.getProviderIds();
  const allPossible = ['openai', 'anthropic', 'gemini', 'groq', 'mistral', 'perplexity'];
  const missing = allPossible.filter(p => !configured.includes(p));
  
  return {
    configured,
    missing,
    total: configured.length
  };
}

// Export default manager functions for backward compatibility
export default {
  getProvider: (id: string) => getAIProviderManager().getProvider(id),
  getAllProviders: () => getAIProviderManager().getAllProviders(),
  getProviderIds: () => getAIProviderManager().getProviderIds(),
  hasProvider: (id: string) => getAIProviderManager().hasProvider(id),
  checkStatus: checkProvidersStatus
};
