import { NextRequest, NextResponse } from 'next/server';
import { allAIProviders } from '@/lib/ai-providers';

// Valid API keys
const VALID_API_KEYS = new Set([
  process.env.EXPREZZZO_API_KEY,
  process.env.OPENAI_CUSTOM_GPT_KEY
]);

export async function POST(req: NextRequest) {
  // Authenticate
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || !VALID_API_KEYS.has(apiKey)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      prompt,
      providers = ['groq'], // Default to cheapest
      mode = 'first-success',
      maxTokens = 500,
      temperature = 0.7
    } = body;

    let response;
    switch(mode) {
      case 'parallel':
        response = await executeParallel(prompt, providers, maxTokens, temperature);
        break;
      case 'consensus':
        response = await executeConsensus(prompt, providers, maxTokens, temperature);
        break;
      default:
        response = await executeWithFailover(prompt, providers, maxTokens, temperature);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID(),
      mode,
      providers_used: response.providers,
      response: response.content,
      metadata: {
        tokens: response.tokens,
        latency_ms: response.latency,
        cost_usd: response.cost
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      fallback: "Service temporarily unavailable"
    }, { status: 500 });
  }
}

async function executeWithFailover(
  prompt: string, 
  providers: string[], 
  maxTokens: number, 
  temperature: number
) {
  for (const providerId of providers) {
    try {
      const provider = allAIProviders.find(p => p.id === providerId);
      if (!provider) continue;
      
      const start = Date.now();
      let content = '';
      
      // Pass options as second parameter
      for await (const chunk of provider.streamChatCompletion(
        [{ role: 'user', content: prompt }],
        { maxTokens, temperature }
      )) {
        content += chunk;
        // Check token limit
        if (content.split(' ').length * 1.3 > maxTokens) break;
      }
      
      return {
        content,
        providers: [providerId],
        latency: Date.now() - start,
        tokens: content.split(' ').length * 1.3,
        cost: calculateCost(providerId, content)
      };
    } catch (error) {
      console.log(`Provider ${providerId} failed, trying next...`);
      continue;
    }
  }
  throw new Error('All providers failed');
}

async function executeParallel(
  prompt: string, 
  providers: string[],
  maxTokens: number,
  temperature: number
) {
  const results = await Promise.all(providers.map(async (providerId) => {
    const provider = allAIProviders.find(p => p.id === providerId);
    if (!provider) return null;

    try {
      let content = '';
      for await (const chunk of provider.streamChatCompletion(
        [{ role: 'user', content: prompt }],
        { maxTokens, temperature }
      )) {
        content += chunk;
      }
      return { providerId, content };
    } catch {
      return null;
    }
  }));

  const successful = results.filter(r => r !== null) as { providerId: string, content: string }[];
  
  return {
    content: successful.map(r => ({ provider: r.providerId, response: r.content })),
    providers: successful.map(r => r.providerId),
    latency: 0,
    tokens: 0,
    cost: 0
  };
}

async function executeConsensus(
  prompt: string, 
  providers: string[],
  maxTokens: number,
  temperature: number
) {
  // For now, just reuse parallel logic
  return executeParallel(prompt, providers, maxTokens, temperature);
}

function calculateCost(provider: string, content: string): number {
  const rates: Record<string, number> = {
    'groq': 0.00001,
    'openai': 0.00015,
    'anthropic': 0.00012,
    'gemini': 0.00008
  };
  const tokens = content.split(' ').length * 1.3;
  return tokens * (rates[provider] || 0.0001);
}
