// lib/ai-providers.ts
// FIXED: Always returns content, never silently fails

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';

// Define common interfaces
export interface AIServiceConfig {
  apiKey: string;
  model: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  id: string;
  name: string;
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
      console.log(`[OpenAI] Starting stream with model ${this.model}`);
      
      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages as any,
        stream: true,
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
      });

      let totalContent = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          totalContent += content;
          yield content;
        }
      }
      
      console.log(`[OpenAI] Stream completed, total length: ${totalContent.length}`);
      
      // If no content was generated, yield an error message
      if (totalContent.length === 0) {
        yield 'OpenAI returned an empty response.';
      }
      
    } catch (error: any) {
      console.error(`[OpenAI] Error:`, error);
      // Always yield something so the orchestrator gets a response
      yield `ERROR from OpenAI (${this.model}): ${error.message || 'Unknown error occurred'}`;
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
      console.log(`[Gemini] Starting stream with model ${this.model}`);
      
      const model = this.genAI.getGenerativeModel({ 
        model: this.model,
        generationConfig: {
          maxOutputTokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.7,
        }
      });
      
      // Convert messages to Gemini format
      const lastMessage = messages[messages.length - 1];
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      const chat = model.startChat({ history: history as any });
      const result = await chat.sendMessageStream(lastMessage.content);

      let totalContent = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          totalContent += chunkText;
          yield chunkText;
        }
      }
      
      console.log(`[Gemini] Stream completed, total length: ${totalContent.length}`);
      
      if (totalContent.length === 0) {
        yield 'Gemini returned an empty response.';
      }
      
    } catch (error: any) {
      console.error(`[Gemini] Error:`, error);
      yield `ERROR from Gemini (${this.model}): ${error.message || 'Unknown error occurred'}`;
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
      console.log(`[Anthropic] Starting stream with model ${this.model}`);
      
      const stream = await this.anthropic.messages.stream({
        model: this.model,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.7,
        messages: messages as any,
      });

      let totalContent = '';
      for await (const message of stream) {
        if (message.type === 'content_block_delta' && message.delta.type === 'text_delta') {
          const content = message.delta.text;
          if (content) {
            totalContent += content;
            yield content;
          }
        }
      }
      
      console.log(`[Anthropic] Stream completed, total length: ${totalContent.length}`);
      
      if (totalContent.length === 0) {
        yield 'Anthropic returned an empty response.';
      }
      
    } catch (error: any) {
      console.error(`[Anthropic] Error:`, error);
      yield `ERROR from Anthropic (${this.model}): ${error.message || 'Unknown error occurred'}`;
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
    
    console.log(`[Groq] Initializing with API key: ${config.apiKey.substring(0, 10)}...`);
    this.groq = new Groq({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async *streamChatCompletion(messages: AIChatMessage[], options?: StreamOptions): AsyncGenerator<string, void, unknown> {
    try {
      console.log(`[Groq] Starting stream with model ${this.model}`);
      console.log(`[Groq] Messages:`, messages);
      console.log(`[Groq] Options:`, options);
      
      const stream = await this.groq.chat.completions.create({
        messages: messages as any,
        model: this.model,
        stream: true,
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
      });

      let totalContent = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          totalContent += content;
          yield content;
        }
      }
      
      console.log(`[Groq] Stream completed, total length: ${totalContent.length}`);
      
      if (totalContent.length === 0) {
        yield 'Groq returned an empty response.';
      }
      
    } catch (error: any) {
      console.error(`[Groq] Error:`, error);
      console.error(`[Groq] Error details:`, error.response?.data || error.message);
      yield `ERROR from Groq (${this.model}): ${error.message || 'Unknown error occurred'}`;
    }
  }
}

// --- Initialize providers ---
console.log('[AI Providers] Initializing providers...');
console.log('[AI Providers] Environment check:', {
  hasOpenAI: !!process.env.OPENAI_API_KEY,
  openAIKeyStart: process.env.OPENAI_API_KEY?.substring(0, 10),
  hasGroq: !!process.env.GROQ_API_KEY,
  groqKeyStart: process.env.GROQ_API_KEY?.substring(0, 10),
  hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
  anthropicKeyStart: process.env.ANTHROPIC_API_KEY?.substring(0, 10),
  hasGemini: !!process.env.GOOGLE_AI_API_KEY,
  geminiKeyStart: process.env.GOOGLE_AI_API_KEY?.substring(0, 10),
});

// List of all instantiated AI Providers
export const allAIProviders: AIProvider[] = [];

// Add OpenAI if configured
if (process.env.OPENAI_API_KEY) {
  try {
    allAIProviders.push(new OpenAIAIProvider({ 
      apiKey: process.env.OPENAI_API_KEY, 
      model: 'gpt-4o' 
    }));
    console.log('[AI Providers] OpenAI provider added');
  } catch (error) {
    console.error('[AI Providers] Failed to initialize OpenAI:', error);
  }
}

// Add Anthropic if configured
if (process.env.ANTHROPIC_API_KEY) {
  try {
    allAIProviders.push(new AnthropicAIProvider({ 
      apiKey: process.env.ANTHROPIC_API_KEY, 
      model: 'claude-3-opus-20240229' 
    }));
    console.log('[AI Providers] Anthropic provider added');
  } catch (error) {
    console.error('[AI Providers] Failed to initialize Anthropic:', error);
  }
}

// Add Gemini if configured
if (process.env.GOOGLE_AI_API_KEY) {
  try {
    allAIProviders.push(new GeminiAIProvider({ 
      apiKey: process.env.GOOGLE_AI_API_KEY, 
      model: 'gemini-pro' 
    }));
    console.log('[AI Providers] Gemini provider added');
  } catch (error) {
    console.error('[AI Providers] Failed to initialize Gemini:', error);
  }
}

// Add Groq if configured (or use hardcoded for testing)
const groqKey = process.env.GROQ_API_KEY || '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';
if (groqKey) {
  try {
    allAIProviders.push(new GroqAIProvider({ 
      apiKey: groqKey, 
      model: 'llama3-8b-8192' 
    }));
    console.log('[AI Providers] Groq provider added');
  } catch (error) {
    console.error('[AI Providers] Failed to initialize Groq:', error);
  }
}

console.log(`[AI Providers] Total providers initialized: ${allAIProviders.length}`);
console.log(`[AI Providers] Provider IDs: ${allAIProviders.map(p => p.id).join(', ')}`);

// Export a test function for debugging
export async function testProvider(providerId: string, prompt: string): Promise<string> {
  const provider = allAIProviders.find(p => p.id === providerId);
  if (!provider) {
    return `Provider ${providerId} not found. Available: ${allAIProviders.map(p => p.id).join(', ')}`;
  }
  
  let result = '';
  try {
    for await (const chunk of provider.streamChatCompletion([{ role: 'user', content: prompt }])) {
      result += chunk;
    }
  } catch (error: any) {
    result = `Error: ${error.message}`;
  }
  
  return result;
}
