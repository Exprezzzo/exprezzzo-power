// app/api/chat/route.ts
// Streaming chat API with intelligent multi-model support and fallback chains

import { NextRequest } from 'next/server';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { 
  modelOrchestrator, 
  executeWithIntelligentRouting 
} from '@/lib/modelOrchestrator';
import { 
  ModelId, 
  APIResponse, 
  StreamResponse,
  SessionSettings 
} from '@/types/ai-playground';

export const runtime = 'nodejs';

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const gemini = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ''
);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  settings: SessionSettings;
  stream?: boolean;
  preferredModel?: ModelId;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, stream = true, preferredModel } = body;
    
    // Provide default settings if none provided
    const settings: SessionSettings = body.settings || {
      temperature: 0.7,
      maxTokens: 1000,
      modelSelection: 'gpt-4',
      streamingEnabled: true,
      contextWindow: 4000,
      systemPrompt: '',
      timeoutMs: 30000
    };

    // Validate required fields
    if (!messages || messages.length === 0) {
      return Response.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Messages are required'
        }
      } as APIResponse, { status: 400 });
    }

    const userMessage = messages[messages.length - 1]?.content || '';
    const systemPrompt = messages.find(m => m.role === 'system')?.content;
    
    // Build context from conversation history
    const context = messages
      .filter(m => m.role !== 'system')
      .map(m => m.content);

    if (stream) {
      return handleStreamingResponse(
        userMessage, 
        context, 
        settings, 
        preferredModel,
        systemPrompt
      );
    } else {
      return handleNonStreamingResponse(
        userMessage, 
        context, 
        settings, 
        preferredModel,
        systemPrompt
      );
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process request'
      }
    } as APIResponse, { status: 500 });
  }
}

async function handleStreamingResponse(
  prompt: string,
  context: string[],
  settings: SessionSettings,
  preferredModel?: ModelId,
  systemPrompt?: string
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Use intelligent routing with model orchestrator
        const execution = await executeWithIntelligentRouting(
          prompt,
          context,
          {
            preferredModel,
            fallbackEnabled: true,
            maxRetries: 3
          }
        );

        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Send metadata
        const metadataChunk: StreamResponse = {
          id: requestId,
          type: 'metadata',
          metadata: {
            requestId,
            finishReason: 'stop',
            tokens: 0,
            cost: 0,
            latency: 0,
            cached: false
          }
        };
        
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(metadataChunk)}\n\n`)
        );

        // Execute the actual streaming request
        const streamingResponse = await executeStreamingRequest(
          execution.modelUsed,
          prompt,
          context,
          settings,
          systemPrompt
        );

        let totalTokens = 0;
        let responseText = '';

        if (streamingResponse) {
          for await (const chunk of streamingResponse) {
            if (chunk.choices && chunk.choices[0]?.delta?.content) {
              const content = chunk.choices[0].delta.content;
              responseText += content;
              totalTokens += 1; // Approximate

              const streamChunk: StreamResponse = {
                id: requestId,
                type: 'chunk',
                content
              };

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(streamChunk)}\n\n`)
              );
            }
          }
        }

        // Send completion metadata
        const completionChunk: StreamResponse = {
          id: requestId,
          type: 'done',
          metadata: {
            requestId,
            finishReason: 'stop',
            tokens: totalTokens,
            cost: calculateCost(execution.modelUsed, totalTokens),
            latency: execution.totalTime,
            cached: false
          }
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(completionChunk)}\n\n`)
        );

        controller.close();

      } catch (error) {
        console.error('Streaming error:', error);
        const errorChunk: StreamResponse = {
          id: `error_${Date.now()}`,
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`)
        );
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function handleNonStreamingResponse(
  prompt: string,
  context: string[],
  settings: SessionSettings,
  preferredModel?: ModelId,
  systemPrompt?: string
): Promise<Response> {
  try {
    const startTime = Date.now();
    
    // Use intelligent routing
    const execution = await executeWithIntelligentRouting(
      prompt,
      context,
      {
        preferredModel,
        fallbackEnabled: true,
        maxRetries: 3
      }
    );

    const response = await executeNonStreamingRequest(
      execution.modelUsed,
      prompt,
      context,
      settings,
      systemPrompt
    );

    const totalTime = Date.now() - startTime;
    const tokens = estimateTokens(response);

    return Response.json({
      success: true,
      data: {
        content: response,
        modelUsed: execution.modelUsed,
        complexity: execution.complexity
      },
      metadata: {
        requestId: `req_${Date.now()}`,
        timestamp: new Date(),
        modelUsed: execution.modelUsed,
        tokensUsed: tokens,
        cost: calculateCost(execution.modelUsed, tokens)
      }
    } as APIResponse);

  } catch (error) {
    console.error('Non-streaming error:', error);
    return Response.json({
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    } as APIResponse, { status: 500 });
  }
}

async function executeStreamingRequest(
  modelId: ModelId,
  prompt: string,
  context: string[],
  settings: SessionSettings,
  systemPrompt?: string
): Promise<AsyncIterable<any> | null> {
  const messages = buildMessages(prompt, context, systemPrompt);

  switch (modelId) {
    case 'gpt-4o':
    case 'gpt-4o-mini':
    case 'gpt-3.5-turbo':
      return await openai.chat.completions.create({
        model: getOpenAIModel(modelId),
        messages: messages as any,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        top_p: settings.topP,
        frequency_penalty: settings.frequencyPenalty,
        presence_penalty: settings.presencePenalty,
        stream: true,
      });

    case 'claude-3-5-sonnet':
    case 'claude-3-opus':
    case 'claude-3-haiku':
      // Anthropic streaming implementation
      return await streamAnthropic(modelId, messages, settings);

    case 'gemini-pro':
    case 'gemini-flash':
      return await streamGemini(modelId, messages, settings);

    case 'mixtral-8x7b':
    case 'llama-3.1-70b':
      return await streamGroq(modelId, messages, settings);

    default:
      throw new Error(`Unsupported model: ${modelId}`);
  }
}

async function executeNonStreamingRequest(
  modelId: ModelId,
  prompt: string,
  context: string[],
  settings: SessionSettings,
  systemPrompt?: string
): Promise<string> {
  const messages = buildMessages(prompt, context, systemPrompt);

  switch (modelId) {
    case 'gpt-4o':
    case 'gpt-4o-mini':
    case 'gpt-3.5-turbo':
      const openaiResponse = await openai.chat.completions.create({
        model: getOpenAIModel(modelId),
        messages: messages as any,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        top_p: settings.topP,
        frequency_penalty: settings.frequencyPenalty,
        presence_penalty: settings.presencePenalty,
      });
      return openaiResponse.choices[0]?.message?.content || '';

    case 'claude-3-5-sonnet':
    case 'claude-3-opus':
    case 'claude-3-haiku':
      const anthropicResponse = await anthropic.messages.create({
        model: getAnthropicModel(modelId),
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
        messages: messages.filter(m => m.role !== 'system') as any,
        system: messages.find(m => m.role === 'system')?.content,
      });
      return anthropicResponse.content[0]?.type === 'text' 
        ? anthropicResponse.content[0].text 
        : '';

    case 'gemini-pro':
    case 'gemini-flash':
      const geminiModel = gemini.getGenerativeModel({ 
        model: getGeminiModel(modelId) 
      });
      const geminiResponse = await geminiModel.generateContent(
        messages.map(m => m.content).join('\n')
      );
      return geminiResponse.response.text();

    case 'mixtral-8x7b':
    case 'llama-3.1-70b':
      const groqResponse = await groq.chat.completions.create({
        model: getGroqModel(modelId),
        messages: messages as any,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
      });
      return groqResponse.choices[0]?.message?.content || '';

    default:
      throw new Error(`Unsupported model: ${modelId}`);
  }
}

// Helper functions for streaming different providers
async function* streamAnthropic(
  modelId: ModelId, 
  messages: any[], 
  settings: SessionSettings
): AsyncIterableIterator<any> {
  const stream = await anthropic.messages.create({
    model: getAnthropicModel(modelId),
    max_tokens: settings.maxTokens,
    temperature: settings.temperature,
    messages: messages.filter(m => m.role !== 'system'),
    system: messages.find(m => m.role === 'system')?.content,
    stream: true,
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      yield {
        choices: [{
          delta: {
            content: chunk.delta.text
          }
        }]
      };
    }
  }
}

async function* streamGemini(
  modelId: ModelId, 
  messages: any[], 
  settings: SessionSettings
): AsyncIterableIterator<any> {
  const model = gemini.getGenerativeModel({ 
    model: getGeminiModel(modelId) 
  });
  
  const result = await model.generateContentStream(
    messages.map(m => m.content).join('\n')
  );

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield {
        choices: [{
          delta: {
            content: text
          }
        }]
      };
    }
  }
}

async function* streamGroq(
  modelId: ModelId, 
  messages: any[], 
  settings: SessionSettings
): AsyncIterableIterator<any> {
  const stream = await groq.chat.completions.create({
    model: getGroqModel(modelId),
    messages: messages,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
    stream: true,
  });

  for await (const chunk of stream) {
    yield chunk;
  }
}

// Helper functions
function buildMessages(prompt: string, context: string[], systemPrompt?: string) {
  const messages: Array<{role: string; content: string}> = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  // Add context as conversation history
  for (let i = 0; i < context.length - 1; i += 2) {
    messages.push({ role: 'user', content: context[i] });
    if (context[i + 1]) {
      messages.push({ role: 'assistant', content: context[i + 1] });
    }
  }
  
  // Add current prompt
  messages.push({ role: 'user', content: prompt });
  
  return messages;
}

function getOpenAIModel(modelId: ModelId): string {
  switch (modelId) {
    case 'gpt-4o': return 'gpt-4o';
    case 'gpt-4o-mini': return 'gpt-4o-mini';
    case 'gpt-3.5-turbo': return 'gpt-3.5-turbo';
    default: return 'gpt-3.5-turbo';
  }
}

function getAnthropicModel(modelId: ModelId): string {
  switch (modelId) {
    case 'claude-3-5-sonnet': return 'claude-3-5-sonnet-20241022';
    case 'claude-3-opus': return 'claude-3-opus-20240229';
    case 'claude-3-haiku': return 'claude-3-haiku-20240307';
    default: return 'claude-3-5-sonnet-20241022';
  }
}

function getGeminiModel(modelId: ModelId): string {
  switch (modelId) {
    case 'gemini-pro': return 'gemini-pro';
    case 'gemini-flash': return 'gemini-1.5-flash';
    default: return 'gemini-pro';
  }
}

function getGroqModel(modelId: ModelId): string {
  switch (modelId) {
    case 'mixtral-8x7b': return 'mixtral-8x7b-32768';
    case 'llama-3.1-70b': return 'llama-3.1-70b-versatile';
    default: return 'mixtral-8x7b-32768';
  }
}

function calculateCost(modelId: ModelId, tokens: number): number {
  const costs = {
    'gpt-4o': 0.015,
    'gpt-4o-mini': 0.00015,
    'gpt-3.5-turbo': 0.001,
    'claude-3-5-sonnet': 0.015,
    'claude-3-opus': 0.015,
    'claude-3-haiku': 0.00025,
    'gemini-pro': 0.0005,
    'gemini-flash': 0.0001,
    'mixtral-8x7b': 0.0008,
    'llama-3.1-70b': 0.0008,
  };
  
  const costPer1k = costs[modelId] || 0.001;
  return (tokens / 1000) * costPer1k;
}

function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
