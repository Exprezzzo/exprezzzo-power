// lib/ai-router.ts
// Robin Hood AI Router - Multi-provider fallback with 40% cost savings

import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'groq';
  model: string;
  directCost: number; // Cost per 1K tokens if going direct
  ourCost: number;    // Our discounted cost (40% savings)
  maxTokens: number;
  contextWindow: number;
  priority: number; // Higher = preferred
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface RouterResponse {
  content: string;
  model: string;
  cost: number;
  savings: number;
  tokens: number;
  latency: number;
  provider: string;
}

// Model configurations with Robin Hood pricing
export const MODELS: ModelConfig[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    model: 'gpt-4o',
    directCost: 0.015,
    ourCost: 0.009,
    maxTokens: 4096,
    contextWindow: 128000,
    priority: 95
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    directCost: 0.015,
    ourCost: 0.009,
    maxTokens: 4096,
    contextWindow: 200000,
    priority: 90
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    directCost: 0.001,
    ourCost: 0.0006,
    maxTokens: 4096,
    contextWindow: 16000,
    priority: 80
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    model: 'gemini-pro',
    directCost: 0.0005,
    ourCost: 0.0003,
    maxTokens: 2048,
    contextWindow: 30720,
    priority: 75
  },
  {
    id: 'llama-3.1-70b',
    name: 'Llama 3.1 70B',
    provider: 'groq',
    model: 'llama-3.1-70b-versatile',
    directCost: 0.0008,
    ourCost: 0.0005,
    maxTokens: 8000,
    contextWindow: 128000,
    priority: 70
  }
];

class AIRouter {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private gemini: GoogleGenerativeAI;
  private groq: Groq;
  private healthStatus: Map<string, boolean> = new Map();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });

    this.gemini = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY || ''
    );

    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });

    // Initialize all models as healthy
    MODELS.forEach(model => {
      this.healthStatus.set(model.id, true);
    });
  }

  // Main routing function with fallback chain
  async chat(
    messages: ChatMessage[],
    preferredModelId?: string,
    options: {
      maxRetries?: number;
      temperature?: number;
    } = {}
  ): Promise<RouterResponse> {
    const { maxRetries = 3, temperature = 0.7 } = options;
    const startTime = Date.now();

    // Build fallback chain - preferred model first, then by priority
    const fallbackChain = this.buildFallbackChain(preferredModelId);
    
    let lastError: Error | null = null;
    
    for (const model of fallbackChain) {
      // Skip unhealthy models
      if (!this.healthStatus.get(model.id)) {
        continue;
      }

      try {
        console.log(`🔄 Trying ${model.name} (${model.provider})`);
        
        const response = await this.callModel(model, messages, temperature);
        const latency = Date.now() - startTime;
        const tokens = this.estimateTokens(response);
        const cost = (tokens / 1000) * model.ourCost;
        const savings = (tokens / 1000) * (model.directCost - model.ourCost);

        console.log(`✅ Success with ${model.name} - ${tokens} tokens, $${cost.toFixed(4)} cost, $${savings.toFixed(4)} saved`);

        return {
          content: response,
          model: model.name,
          cost,
          savings,
          tokens,
          latency,
          provider: model.provider
        };

      } catch (error) {
        console.error(`❌ ${model.name} failed:`, error instanceof Error ? error.message : error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Mark model as unhealthy temporarily
        this.healthStatus.set(model.id, false);
        setTimeout(() => {
          this.healthStatus.set(model.id, true);
        }, 30000); // Reset health after 30 seconds
      }
    }

    // If all models failed, throw the last error
    throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  private buildFallbackChain(preferredModelId?: string): ModelConfig[] {
    const availableModels = MODELS.filter(m => this.healthStatus.get(m.id));
    
    if (preferredModelId) {
      const preferredModel = availableModels.find(m => m.id === preferredModelId);
      if (preferredModel) {
        // Put preferred model first, then others by priority
        const otherModels = availableModels
          .filter(m => m.id !== preferredModelId)
          .sort((a, b) => b.priority - a.priority);
        return [preferredModel, ...otherModels];
      }
    }

    // No preferred model or not found, sort by priority
    return availableModels.sort((a, b) => b.priority - a.priority);
  }

  private async callModel(
    model: ModelConfig,
    messages: ChatMessage[],
    temperature: number
  ): Promise<string> {
    switch (model.provider) {
      case 'openai':
        return this.callOpenAI(model, messages, temperature);
      case 'anthropic':
        return this.callAnthropic(model, messages, temperature);
      case 'google':
        return this.callGoogle(model, messages, temperature);
      case 'groq':
        return this.callGroq(model, messages, temperature);
      default:
        throw new Error(`Unknown provider: ${model.provider}`);
    }
  }

  private async callOpenAI(
    model: ModelConfig,
    messages: ChatMessage[],
    temperature: number
  ): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: model.model,
      messages: messages as any,
      temperature,
      max_tokens: model.maxTokens,
    });

    return response.choices[0]?.message?.content || '';
  }

  private async callAnthropic(
    model: ModelConfig,
    messages: ChatMessage[],
    temperature: number
  ): Promise<string> {
    // Separate system message from conversation
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await this.anthropic.messages.create({
      model: model.model,
      max_tokens: model.maxTokens,
      temperature,
      messages: conversationMessages as any,
      system: systemMessage,
    });

    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : '';
  }

  private async callGoogle(
    model: ModelConfig,
    messages: ChatMessage[],
    temperature: number
  ): Promise<string> {
    const geminiModel = this.gemini.getGenerativeModel({ 
      model: model.model,
      generationConfig: {
        temperature,
        maxOutputTokens: model.maxTokens,
      }
    });

    // Convert messages to Gemini format
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  }

  private async callGroq(
    model: ModelConfig,
    messages: ChatMessage[],
    temperature: number
  ): Promise<string> {
    const response = await this.groq.chat.completions.create({
      model: model.model,
      messages: messages as any,
      temperature,
      max_tokens: model.maxTokens,
    });

    return response.choices[0]?.message?.content || '';
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  // Get available models with their status
  getAvailableModels(): Array<ModelConfig & { healthy: boolean }> {
    return MODELS.map(model => ({
      ...model,
      healthy: this.healthStatus.get(model.id) || false
    }));
  }

  // Get total savings information
  getTotalSavings(tokens: number, modelId: string): number {
    const model = MODELS.find(m => m.id === modelId);
    if (!model) return 0;
    return (tokens / 1000) * (model.directCost - model.ourCost);
  }
}

// Export singleton instance
export const aiRouter = new AIRouter();

// Export types and utilities
export { MODELS };
export type { ModelConfig, ChatMessage, RouterResponse };