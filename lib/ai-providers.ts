// lib/ai-providers.ts
// FIXED VERSION - Accepts options parameter for streamChatCompletion

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';

// Define common interfaces for AI Provider
export interface AIServiceConfig {
  apiKey: string;
  model: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ADD: Options interface for streaming
export interface StreamOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  id: string;
  name: string;
  // UPDATED: Now accepts optional second parameter
  streamChatCompletion: (messages: AIChatMessage[], options?: StreamOptions) => AsyncGenerator<string, void, unknown>;
}

// --- OpenAI Provider ---
class OpenAIAIProvider implements AIProvider {
  id = 'openai';
  name = 'OpenAI';
  private openai: OpenAI;
  private model: string;

  constructor(config: AIServiceConfig) {
    if (!config.apiKey) throw new Error('OpenAI API Key is missing.');
    this.openai = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async *streamChatCompletion(messages: AIChatMessage[], options?: StreamOptions): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages as any,
        stream: true,
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
      });

      for await (const chunk of stream) {
        yield chunk.choices[0]?.delta?.content || '';
      }
    } catch (error: any) {
      console.error(`OpenAI streaming error for model ${this.model}:`, error);
      yield `ERROR: Could not get response from OpenAI. ${error.message || JSON.stringify(error)}`;
    }
  }
}

// --- Google Gemini Provider ---
class GeminiAIProvider implements AIProvider {
  id = 'gemini';
  name = 'Google Gemini';
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(config: AIServiceConfig) {
    if (!config.apiKey) throw new Error('Gemini API Key is missing.');
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model;
  }

  async *streamChatCompletion(messages: AIChatMessage[], options?: StreamOptions): AsyncGenerator<string, void, unknown> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.model,
        generationConfig: {
          maxOutputTokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.7,
        }
      });
      const chat = model.startChat({ history: messages.slice(0, -1) as any });
      const result = await chat.sendMessageStream(messages[messages.length - 1].content);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        yield chunkText;
      }
    } catch (error: any) {
      console.error(`Gemini streaming error for model ${this.model}:`, error);
      yield `ERROR: Could not get response from Gemini. ${error.message || JSON.stringify(error)}`;
    }
  }
}

// --- Anthropic Claude Provider ---
class AnthropicAIProvider implements AIProvider {
  id = 'anthropic';
  name = 'Anthropic Claude';
  private anthropic: Anthropic;
  private model: string;

  constructor(config: AIServiceConfig) {
    if (!config.apiKey) throw new Error('Anthropic API Key is missing.');
    this.anthropic = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async *streamChatCompletion(messages: AIChatMessage[], options?: StreamOptions): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.anthropic.messages.stream({
        model: this.model,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.7,
        messages: messages as any,
      });

      for await (const message of stream) {
        if (message.type === 'content_block_delta' && message.delta.type === 'text_delta') {
          yield message.delta.text;
        }
      }
    } catch (error: any) {
      console.error(`Anthropic streaming error for model ${this.model}:`, error);
      yield `ERROR: Could not get response from Anthropic. ${error.message || JSON.stringify(error)}`;
    }
  }
}

// --- Groq Provider ---
class GroqAIProvider implements AIProvider {
  id = 'groq';
  name = 'Groq';
  private groq: Groq;
  private model: string;

  constructor(config: AIServiceConfig) {
    if (!config.apiKey) throw new Error('Groq API Key is missing.');
    this.groq = new Groq({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async *streamChatCompletion(messages: AIChatMessage[], options?: StreamOptions): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.groq.chat.completions.create({
        messages: messages as any,
        model: this.model,
        stream: true,
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
      });

      for await (const chunk of stream) {
        yield chunk.choices[0]?.delta?.content || '';
      }
    } catch (error: any) {
      console.error(`Groq streaming error for model ${this.model}:`, error);
      yield `ERROR: Could not get response from Groq. ${error.message || JSON.stringify(error)}`;
    }
  }
}

// --- List of all instantiated AI Providers ---
// Initialize providers only if API keys are available
export const allAIProviders: AIProvider[] = [
  process.env.OPENAI_API_KEY ? new OpenAIAIProvider({ apiKey: process.env.OPENAI_API_KEY, model: 'gpt-4o' }) : null,
  process.env.ANTHROPIC_API_KEY ? new AnthropicAIProvider({ apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-3-opus-20240229' }) : null,
  process.env.GOOGLE_AI_API_KEY ? new GeminiAIProvider({ apiKey: process.env.GOOGLE_AI_API_KEY, model: 'gemini-pro' }) : null,
  process.env.GROQ_API_KEY ? new GroqAIProvider({ apiKey: process.env.GROQ_API_KEY, model: 'llama3-8b-8192' }) : null,
].filter(Boolean) as AIProvider[];
