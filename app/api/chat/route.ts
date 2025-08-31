import { NextRequest, NextResponse } from 'next/server';
import { allow } from '@/lib/ratelimit';
import { logRun } from '@/lib/persistence';

// Provider configurations
const AI_PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-sonnet-20240229',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    apiKey: process.env.GROQ_API_KEY,
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.1-70b-versatile',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    apiKey: process.env.GEMINI_API_KEY,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-pro',
  },
};

// Simplified router
async function* sendVia(providerId: string, prompt: string) {
  const provider = AI_PROVIDERS[providerId as keyof typeof AI_PROVIDERS];
  if (!provider?.apiKey) throw new Error(`Provider ${providerId} not configured`);
  
  // Mock implementation - replace with actual API calls
  const mockResponse = `Response from ${provider.name}: ${prompt.slice(0, 50)}...`;
  for (const char of mockResponse) {
    yield { token: char };
  }
}

export async function POST(req: NextRequest) {
  const { prompt, messages, models = ['groq', 'openai', 'anthropic'] } = await req.json();
  const finalPrompt = prompt || messages?.[messages.length - 1]?.content || '';
  
  const ip = req.headers.get('x-forwarded-for') || 'anon';
  if (!allow(ip)) return new Response('Too Many Requests', { status: 429 });

  const runRef = await logRun(undefined, { prompt: finalPrompt, models }).catch(() => null);
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (s: string) => controller.enqueue(encoder.encode(s));
      let success = false;
      
      for (const id of models) {
        try {
          for await (const { token } of sendVia(id, finalPrompt)) {
            write(`data: ${token}\n\n`);
            success = true;
          }
          break;
        } catch (e) {
          write(`event: warn\ndata: fallback:${id}\n\n`);
        }
      }
      
      if (!success) write(`data: {"error":"All providers unavailable"}\n\n`);
      write(`data: [DONE]\n\n`);
      controller.close();
    }
  });
  
  return new Response(stream, { 
    headers: { 
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    } 
  });
}