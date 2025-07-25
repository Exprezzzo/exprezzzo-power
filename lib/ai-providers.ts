// lib/ai-providers.ts
// Corrected: Removed duplicate 'estimateTokens' definition.
// Defines AI provider interfaces and the Smart Routing logic.
// Implements Groq, OpenAI, Anthropic, and Gemini providers.

import OpenAI from 'openai';
import Groq from 'groq-sdk';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  models: string[];
  costPerMillionTokens?: { input: number; output: number };
  generateStream: (messages: ChatMessage[], model: string) => AsyncIterable<string>;
}

// Initialize providers - check if keys exist
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Log which providers are available for debugging
console.log('AI Providers Status:', {
  groq: !!groq,
  openai: !!openai,
  anthropic: !!anthropic,
  gemini: !!genAI,
});

// --- Types and Interfaces ---
// (Moved to top for better organization, but content is the same)

// Model pricing (per 1K tokens) - OUR COST
const MODEL_COSTS = {
  // Groq models
  'llama3-70b-8192': { input: 0.00059, output: 0.00079 },
  'llama3-8b-8192': { input: 0.00005, output: 0.00010 },
  'mixtral-8x7b-32768': { input: 0.00024, output: 0.00024 },

  // OpenAI models
  'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },

  // Anthropic models
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'claude-instant': { input: 0.0008, output: 0.0024 },

  // Google models
  'gemini-pro': { input: 0.000125, output: 0.000375 },
  'gemini-1.5-flash': { input: 0.00035, output: 0.00105 },
  'gemini-1.5-pro': { input: 0.0035, output: 0.0105 },
};

// Calculate customer price with margin (40% margin = 1.67x multiplier)
const PROFIT_MARGIN_MULTIPLIER = 1 / (1 - parseFloat(process.env.PROFIT_MARGIN || '0.4'));

export function getCustomerPrice(model: string, inputTokens: number, outputTokens: number): number {
  const costs = MODEL_COSTS[model as keyof typeof MODEL_COSTS];
  if (!costs) return 0;
  const ourCost = (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;
  const customerPrice = ourCost * PROFIT_MARGIN_MULTIPLIER;
  return Number(customerPrice.toFixed(6));
}

// Token estimation (simple approximation)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Check if we should throttle user based on daily cost limit
export function shouldThrottle(userDailyCost: number): boolean {
  const maxDailyCost = parseFloat(process.env.MAX_DAILY_COST_PER_USER || '10.00');
  const usageAlertThreshold = parseFloat(process.env.USAGE_ALERT_THRESHOLD || '0.8');
  return userDailyCost >= (maxDailyCost * usageAlertThreshold);
}

// --- AI Provider Implementations ---
class GroqAIProvider implements AIProvider {
  id = 'groq'; name = 'Groq'; description = 'Fast Llama 3 on Groq';
  models = ['llama-3-8b', 'llama-3-70b', 'mixtral-8x7b-32768'];
  costPerMillionTokens = { input: 0.59, output: 0.79 };
  private groq: Groq | null;
  constructor() { this.groq = groq; if (!this.groq) console.warn('Groq API Key is missing. GroqAIProvider not fully initialized.'); }
  async *generateStream(messages: ChatMessage[], model: string): AsyncIterable<string> {
    if (!this.groq) { yield 'ERROR: Groq API Key is not configured.'; return; }
    try {
      const stream = await this.groq.chat.completions.create({ messages: messages as any, model: model, stream: true, });
      for await (const chunk of stream) { yield chunk.choices[0]?.delta?.content || ''; }
    } catch (error) { console.error(`Groq streaming error for model ${model}:`, error); yield `ERROR: Could not get response from Groq. ${error instanceof Error ? error.message : JSON.stringify(error)}`; }
  }
}

class OpenAIAIProvider implements AIProvider {
  id = 'openai'; name = 'OpenAI'; description = 'GPT models from OpenAI';
  models = ['gpt-4', 'gpt-3.5-turbo']; costPerMillionTokens = { input: 10.00, output: 30.00 };
  private openai: OpenAI | null;
  constructor() { this.openai = openai; if (!this.openai) console.warn('OpenAI API Key is missing. OpenAIProvider not fully initialized.'); }
  async *generateStream(messages: ChatMessage[], model: string): AsyncIterable<string> {
    if (!this.openai) { yield 'ERROR: OpenAI API Key is not configured.'; return; }
    try {
      const stream = await this.openai.chat.completions.create({ messages: messages as any, model: model, stream: true, });
      for await (const chunk of stream) { yield chunk.choices[0]?.delta?.content || ''; }
    } catch (error) { console.error(`OpenAI streaming error for model ${model}:`, error); yield `ERROR: Could not get response from OpenAI. ${error instanceof Error ? error.message : JSON.stringify(error)}`; }
  }
}

class AnthropicAIProvider implements AIProvider {
  id = 'anthropic'; name = 'Anthropic'; description = 'Claude models from Anthropic';
  models = ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-instant']; costPerMillionTokens = { input: 15.00, output: 75.00 };
  private anthropic: Anthropic | null;
  constructor() { this.anthropic = anthropic; if (!this.anthropic) console.warn('Anthropic API Key is missing. AnthropicProvider not fully initialized.'); }
  async *generateStream(messages: ChatMessage[], model: string): AsyncIterable<string> {
    if (!this.anthropic) { yield 'ERROR: Anthropic API Key is not configured.'; return; }
    try {
      const stream = await this.anthropic.messages.stream({ messages: messages.filter(m => m.role !== 'system') as any, model: model, max_tokens: 1024, });
      for await (const messageChunk of stream) { if (messageChunk.type === 'content_block_delta' && messageChunk.delta.type === 'text_delta') { yield messageChunk.delta.text; } }
    } catch (error) { console.error(`Anthropic streaming error for model ${model}:`, error); yield `ERROR: Could not get response from Anthropic. ${error instanceof Error ? error.message : JSON.stringify(error)}`; }
  }
}

class GeminiProvider implements AIProvider {
  id = 'gemini'; name = 'Google Gemini'; description = 'Gemini models from Google';
  models = ['gemini-2-pro', 'gemini-1.5-flash', 'gemini-1.5-pro']; costPerMillionTokens = { input: 0.00035, output: 0.00105 };
  private genAI: GoogleGenerativeAI | null;
  constructor() { this.genAI = genAI; if (!this.genAI) console.warn('GEMINI_API_KEY is missing. GeminiProvider not fully initialized.'); }
  async *generateStream(messages: ChatMessage[], model: string): AsyncIterable<string> {
    if (!this.genAI) { yield 'ERROR: Gemini API Key is not configured.'; return; }
    try {
      const geminiModel = this.genAI.getGenerativeModel({ model: model });
      const chat = geminiModel.startChat({ history: messages.slice(0, -1).map(m => ({ role: m.role === 'assistant' ? 'model' : m.role, parts: [{ text: m.content }], })), });
      const result = await chat.sendMessageStream( messages[messages.length - 1].content );
      for await (const chunk of result.stream) { yield chunk.text(); }
    } catch (error) { console.error(`Gemini streaming error for model ${model}:`, error); yield `ERROR: Could not get response from Gemini. ${error instanceof Error ? error.message : JSON.stringify(error)}`; }
    }
  }
}

// --- List of all instantiated AI Providers ---
export const allAIProviders: AIProvider[] = [
  new GroqAIProvider(),
  new OpenAIAIProvider(),
  new AnthropicAIProvider(),
  new GeminiProvider(),
];

// --- Smart Routing Logic ---
export async function* smartRouteAndGenerate(messages: ChatMessage[], preferredModel?: string, userDailyCost: number = 0): AsyncIterable<string> {
  // Check throttling
  if (shouldThrottle(userDailyCost)) {
    yield 'ERROR: Daily usage limit approaching. Please upgrade your plan or wait until tomorrow.';
    return;
  }

  let providerToUse: AIProvider | undefined;
  let modelToUse: string | undefined;

  const prompt = messages[messages.length - 1]?.content;
  if (!prompt) { yield `ERROR: Prompt is empty.`; return; }

  if (preferredModel && preferredModel !== 'smart-routing') {
    providerToUse = allAIProviders.find(p => p.models.includes(preferredModel));
    modelToUse = preferredModel;
  }

  if (!providerToUse || preferredModel === 'smart-routing') {
    const availableProviders = allAIProviders.filter(p =>
      p.models.length > 0 && p.costPerMillionTokens && p.costPerMillionTokens.input !== undefined && p.costPerMillionTokens.output !== undefined
    );

    if (availableProviders.length > 0) {
      availableProviders.sort((a, b) => (a.costPerMillionTokens?.input || Infinity) - (b.costPerMillionTokens?.input || Infinity));
      providerToUse = availableProviders[0];
      modelToUse = providerToUse.models[0];
    } else {
      providerToUse = allAIProviders.find(p => p.models.length > 0);
      modelToUse = providerToUse?.models[0];
    }
  }

  if (!providerToUse || !modelToUse) {
    const errorMessage = `ERROR: No suitable AI provider found for prompt. Please check API keys or select a different model.`;
    console.error(errorMessage);
    yield errorMessage;
    return;
  }

  console.log(`Smart Routing: Using ${providerToUse.name} with model ${modelToUse}`);
  yield `[Model: ${providerToUse.name} (${modelToUse})] \n`;
  yield* providerToUse.generateStream(messages, modelToUse);
}

// Cost estimation (simple approximation)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}