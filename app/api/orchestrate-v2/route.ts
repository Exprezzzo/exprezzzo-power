// app/api/orchestrate-v2/route.ts
// Enhanced orchestrator with full conversation context support
import { NextRequest, NextResponse } from 'next/server';
import { allAIProviders } from '@/lib/ai-providers';

// Rate limiting map (in production, use Redis)
const rateLimits = new Map<string, { count: number; resetTime: number }>();

// Valid API keys
const VALID_API_KEYS = new Set([
  process.env.EXPREZZZO_API_KEY,
  'cb65b4b93ed42a3a7a2a8f79c972fdae2a1856437b0cd296e07f9ebf75bb8a9e',
  // Add more keys as needed
].filter(Boolean));

// Clean up rate limits periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, limit] of rateLimits.entries()) {
    if (limit.resetTime < now) {
      rateLimits.delete(key);
    }
  }
}, 60000); // Every minute

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    // Check API key
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey || !VALID_API_KEYS.has(apiKey)) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized - Invalid or missing API key',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }, { status: 401 });
    }

    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `${apiKey}-${clientIp}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100; // 100 requests per minute

    let rateLimit = rateLimits.get(rateLimitKey);
    if (!rateLimit || rateLimit.resetTime < now) {
      rateLimit = { count: 0, resetTime: now + windowMs };
      rateLimits.set(rateLimitKey, rateLimit);
    }

    rateLimit.count++;
    if (rateLimit.count > maxRequests) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        timestamp: new Date().toISOString(),
        request_id: requestId,
        retry_after: Math.ceil((rateLimit.resetTime - now) / 1000)
      }, { status: 429 });
    }

    // Parse request
    const body = await req.json();
    const { 
      prompt,
      messages = [], // Full conversation history
      providers = ['groq'], 
      mode = 'first-success',
      maxTokens = 1000,
      temperature = 0.7,
      stream = false
    } = body;

    // Validate input
    if (!prompt && (!messages || messages.length === 0)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request: prompt or messages required',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }, { status: 400 });
    }

    // Build conversation context
    let conversationMessages = messages;
    if (prompt && !messages.length) {
      // If only prompt provided, create a single user message
      conversationMessages = [{ role: 'user', content: prompt }];
    } else if (prompt && messages.length) {
      // If both provided, append prompt as latest message
      conversationMessages = [
        ...messages,
        { role: 'user', content: prompt }
      ];
    }

    console.log(`[Orchestrator v2] Request ${requestId}: ${conversationMessages.length} messages, providers: ${providers.join(',')}`);

    // Check available providers
    if (allAIProviders.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No AI providers configured',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }, { status: 500 });
    }

    // Execute based on mode
    let response;
    try {
      switch(mode) {
        case 'parallel':
          response = await executeParallel(conversationMessages, providers, maxTokens, temperature);
          break;
        case 'consensus':
          response = await executeConsensus(conversationMessages, providers, maxTokens, temperature);
          break;
        case 'compare':
          response = await executeCompare(conversationMessages, providers, maxTokens, temperature);
          break;
        default:
          response = await executeWithFailover(conversationMessages, providers, maxTokens, temperature);
      }
    } catch (execError: any) {
      console.error(`[Orchestrator v2] Execution error for ${requestId}:`, execError);
      
      return NextResponse.json({
        success: false,
        error: execError.message || 'All providers failed',
        timestamp: new Date().toISOString(),
        request_id: requestId,
        mode,
        providers_attempted: providers
      }, { status: 500 });
    }

    // Return response
    const successResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      request_id: requestId,
      mode,
      providers_used: response.providers,
      response: response.content,
      metadata: {
        tokens: response.tokens || 0,
        latency_ms: Date.now() - startTime,
        cost_usd: response.cost || 0,
        message_count: conversationMessages.length,
        context_used: conversationMessages.length > 1
      }
    };

    console.log(`[Orchestrator v2] Success ${requestId}: ${response.providers.join(',')}, ${response.tokens} tokens`);

    return NextResponse.json(successResponse);

  } catch (error: any) {
    console.error(`[Orchestrator v2] Fatal error ${requestId}:`, error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      request_id: requestId
    }, { status: 500 });
  }
}

// Execute with failover (default mode)
async function executeWithFailover(
  messages: any[], 
  providers: string[], 
  maxTokens: number, 
  temperature: number
) {
  const errors: any[] = [];
  
  for (const providerId of providers) {
    console.log(`[Orchestrator v2] Trying provider: ${providerId}`);
    
    try {
      const provider = allAIProviders.find(p => p.id === providerId);
      
      if (!provider) {
        console.log(`[Orchestrator v2] Provider ${providerId} not configured`);
        errors.push({ provider: providerId, error: 'Provider not configured' });
        continue;
      }
      
      const start = Date.now();
      let content = '';
      
      try {
        console.log(`[Orchestrator v2] Sending ${messages.length} messages to ${providerId}`);
        
        for await (const chunk of provider.streamChatCompletion(messages, { maxTokens, temperature })) {
          content += chunk;
          
          // Safety check
          if (content.length > maxTokens * 10) {
            break;
          }
        }
        
        console.log(`[Orchestrator v2] ${providerId} returned ${content.length} chars`);
        
        if (content && content.trim().length > 0) {
          return {
            content,
            providers: [providerId],
            latency: Date.now() - start,
            tokens: Math.ceil(content.split(' ').length * 1.3),
            cost: calculateCost(providerId, content)
          };
        } else {
          errors.push({ provider: providerId, error: 'Empty response' });
        }
        
      } catch (streamError: any) {
        console.error(`[Orchestrator v2] Stream error for ${providerId}:`, streamError);
        errors.push({ provider: providerId, error: streamError.message });
      }
      
    } catch (error: any) {
      console.error(`[Orchestrator v2] Provider ${providerId} failed:`, error);
      errors.push({ provider: providerId, error: error.message });
    }
  }
  
  throw new Error(`All providers failed. Errors: ${JSON.stringify(errors)}`);
}

// Execute in parallel
async function executeParallel(
  messages: any[],
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
      const start = Date.now();
      
      for await (const chunk of provider.streamChatCompletion(messages, { maxTokens, temperature })) {
        content += chunk;
        if (content.length > maxTokens * 10) break;
      }
      
      return { 
        providerId, 
        content,
        latency: Date.now() - start,
        tokens: Math.ceil(content.split(' ').length * 1.3)
      };
    })
  );

  const successful = results
    .filter((r): r is PromiseFulfilledResult<any> => 
      r.status === 'fulfilled' && r.value.content.length > 0
    )
    .map(r => r.value);
  
  if (successful.length === 0) {
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason);
    throw new Error(`All providers failed in parallel. Errors: ${JSON.stringify(errors)}`);
  }
  
  // Return all responses
  return {
    content: successful.map(r => ({
      provider: r.providerId,
      response: r.content,
      latency: r.latency,
      tokens: r.tokens
    })),
    providers: successful.map(r => r.providerId),
    latency: Math.max(...successful.map(r => r.latency)),
    tokens: successful.reduce((sum, r) => sum + r.tokens, 0),
    cost: successful.reduce((sum, r) => sum + calculateCost(r.providerId, r.content), 0)
  };
}

// Execute and compare responses
async function executeCompare(
  messages: any[],
  providers: string[],
  maxTokens: number,
  temperature: number
) {
  const parallelResult = await executeParallel(messages, providers, maxTokens, temperature);
  
  // Format comparison
  const comparison = {
    responses: parallelResult.content,
    consensus: findConsensus(parallelResult.content),
    diversity_score: calculateDiversity(parallelResult.content),
    recommended: selectBestResponse(parallelResult.content)
  };
  
  return {
    content: comparison,
    providers: parallelResult.providers,
    latency: parallelResult.latency,
    tokens: parallelResult.tokens,
    cost: parallelResult.cost
  };
}

// Execute for consensus
async function executeConsensus(
  messages: any[],
  providers: string[],
  maxTokens: number,
  temperature: number
) {
  const parallelResult = await executeParallel(messages, providers, maxTokens, temperature);
  
  // Simple consensus: most common response pattern
  const consensus = findConsensus(parallelResult.content);
  
  return {
    content: consensus,
    providers: parallelResult.providers,
    latency: parallelResult.latency,
    tokens: Math.ceil(consensus.split(' ').length * 1.3),
    cost: parallelResult.cost
  };
}

// Helper functions
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

function findConsensus(responses: any[]): string {
  // Simple implementation: return the median-length response
  // In production, use more sophisticated consensus algorithms
  const sorted = responses.sort((a, b) => 
    a.response.length - b.response.length
  );
  return sorted[Math.floor(sorted.length / 2)].response;
}

function calculateDiversity(responses: any[]): number {
  // Simple diversity score based on response length variance
  const lengths = responses.map(r => r.response.length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length;
  return Math.sqrt(variance) / avg;
}

function selectBestResponse(responses: any[]): string {
  // Select response with best quality indicators
  // In production, use ML-based quality scoring
  const scored = responses.map(r => ({
    ...r,
    score: r.response.length * (1 / (r.latency / 1000))
  }));
  
  scored.sort((a, b) => b.score - a.score);
  return scored[0].response;
}

// OPTIONS for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  });
}
