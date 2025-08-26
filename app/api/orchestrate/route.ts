import { NextRequest, NextResponse } from 'next/server';
import { allAIProviders } from '@/lib/ai-providers';

// Valid API keys - check both env vars and hardcoded for testing
const VALID_API_KEYS = new Set([
  process.env.EXPREZZZO_API_KEY,
  process.env.OPENAI_CUSTOM_GPT_KEY,
  'cb65b4b93ed42a3a7a2a8f79c972fdae2a1856437b0cd296e07f9ebf75bb8a9e' // Your API key
].filter(Boolean));

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check API key
    const apiKey = req.headers.get('x-api-key');
    
    console.log('[Orchestrator] Received request with API key:', apiKey?.substring(0, 10) + '...');
    console.log('[Orchestrator] Valid keys:', Array.from(VALID_API_KEYS).map(k => k?.substring(0, 10) + '...'));
    
    if (!apiKey || !VALID_API_KEYS.has(apiKey)) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized - Invalid or missing API key',
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID()
      }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { 
      prompt,
      providers = ['groq'], 
      mode = 'first-success',
      maxTokens = 500,
      temperature = 0.7
    } = body;

    console.log('[Orchestrator] Request:', { prompt: prompt?.substring(0, 50), providers, mode });

    // Validate prompt
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid request: prompt is required and must be a string',
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID()
      }, { status: 400 });
    }

    // Check if we have any providers configured
    console.log('[Orchestrator] Available providers:', allAIProviders.map(p => p.id));
    
    if (allAIProviders.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No AI providers configured. Check API keys in environment variables.',
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        debug: {
          hasOpenAI: !!process.env.OPENAI_API_KEY,
          hasGroq: !!process.env.GROQ_API_KEY,
          hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
          hasGemini: !!process.env.GOOGLE_AI_API_KEY
        }
      }, { status: 500 });
    }

    // Execute based on mode
    let response;
    try {
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
    } catch (execError: any) {
      console.error('[Orchestrator] Execution error:', execError);
      
      // Return a proper error response
      return NextResponse.json({
        success: false,
        error: execError.message || 'All providers failed',
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        mode,
        providers_attempted: providers,
        debug: {
          errorType: execError.constructor.name,
          stack: process.env.NODE_ENV === 'development' ? execError.stack : undefined
        }
      }, { status: 500 });
    }

    // Return successful response
    const successResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID(),
      mode,
      providers_used: response.providers,
      response: response.content,
      metadata: {
        tokens: response.tokens || 0,
        latency_ms: Date.now() - startTime,
        cost_usd: response.cost || 0
      }
    };

    console.log('[Orchestrator] Success response:', { 
      providers_used: successResponse.providers_used,
      response_length: successResponse.response?.length 
    });

    return NextResponse.json(successResponse);

  } catch (error: any) {
    console.error('[Orchestrator] Fatal error:', error);
    
    // Always return JSON, even for unexpected errors
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID(),
      fallback: "Service temporarily unavailable",
      debug: {
        errorType: error.constructor.name,
        hasMessage: !!error.message
      }
    }, { status: 500 });
  }
}

async function executeWithFailover(
  prompt: string, 
  providers: string[], 
  maxTokens: number, 
  temperature: number
) {
  const errors: any[] = [];
  
  for (const providerId of providers) {
    console.log(`[Orchestrator] Trying provider: ${providerId}`);
    
    try {
      const provider = allAIProviders.find(p => p.id === providerId);
      
      if (!provider) {
        console.log(`[Orchestrator] Provider ${providerId} not found in configured providers`);
        errors.push({ provider: providerId, error: 'Provider not configured' });
        continue;
      }
      
      const start = Date.now();
      let content = '';
      
      try {
        // Collect all chunks from the stream
        console.log(`[Orchestrator] Starting stream for ${providerId}`);
        
        for await (const chunk of provider.streamChatCompletion(
          [{ role: 'user', content: prompt }],
          { maxTokens, temperature }
        )) {
          content += chunk;
          
          // Safety check to prevent infinite streams
          if (content.length > maxTokens * 10) {
            console.log(`[Orchestrator] Content too long, breaking`);
            break;
          }
        }
        
        console.log(`[Orchestrator] Stream completed for ${providerId}, content length: ${content.length}`);
        
        // If we got content, return it
        if (content && content.trim().length > 0) {
          return {
            content,
            providers: [providerId],
            latency: Date.now() - start,
            tokens: Math.ceil(content.split(' ').length * 1.3),
            cost: calculateCost(providerId, content)
          };
        } else {
          errors.push({ provider: providerId, error: 'Empty response from provider' });
        }
        
      } catch (streamError: any) {
        console.error(`[Orchestrator] Stream error for ${providerId}:`, streamError);
        errors.push({ provider: providerId, error: streamError.message });
      }
      
    } catch (error: any) {
      console.error(`[Orchestrator] Provider ${providerId} failed:`, error);
      errors.push({ provider: providerId, error: error.message });
    }
  }
  
  // If we get here, all providers failed
  throw new Error(`All providers failed. Errors: ${JSON.stringify(errors)}`);
}

async function executeParallel(
  prompt: string, 
  providers: string[],
  maxTokens: number,
  temperature: number
) {
  const results = await Promise.allSettled(
    providers.map(async (providerId) => {
      const provider = allAIProviders.find(p => p.id === providerId);
      if (!provider) {
        throw new Error(`Provider ${providerId} not configured`);
      }

      let content = '';
      for await (const chunk of provider.streamChatCompletion(
        [{ role: 'user', content: prompt }],
        { maxTokens, temperature }
      )) {
        content += chunk;
        if (content.length > maxTokens * 10) break;
      }
      
      return { providerId, content };
    })
  );

  const successful = results
    .filter((r): r is PromiseFulfilledResult<{providerId: string, content: string}> => 
      r.status === 'fulfilled' && r.value.content.length > 0
    )
    .map(r => r.value);
  
  if (successful.length === 0) {
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason);
    throw new Error(`All providers failed in parallel mode. Errors: ${JSON.stringify(errors)}`);
  }
  
  return {
    content: successful.map(r => ({ provider: r.providerId, response: r.content })),
    providers: successful.map(r => r.providerId),
    latency: 0,
    tokens: successful.reduce((sum, r) => sum + Math.ceil(r.content.split(' ').length * 1.3), 0),
    cost: successful.reduce((sum, r) => sum + calculateCost(r.providerId, r.content), 0)
  };
}

async function executeConsensus(
  prompt: string, 
  providers: string[],
  maxTokens: number,
  temperature: number
) {
  // For now, just use parallel execution
  return executeParallel(prompt, providers, maxTokens, temperature);
}

function calculateCost(provider: string, content: string): number {
  const rates: Record<string, number> = {
    'groq': 0.00001,
    'openai': 0.00015,
    'anthropic': 0.00012,
    'gemini': 0.00008
  };
  const tokens = Math.ceil(content.split(' ').length * 1.3);
  return tokens * (rates[provider] || 0.0001);
}
