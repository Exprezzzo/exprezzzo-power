// app/api/roundtable/route.ts
// Simultaneous multi-model comparison API for competitive analysis

import { NextRequest } from 'next/server';
import { 
  ModelId, 
  RoundtableRequest, 
  RoundtableResult, 
  RoundtableResponse,
  APIResponse 
} from '@/types/ai-playground';
import { modelOrchestrator } from '@/lib/modelOrchestrator';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: RoundtableRequest = await request.json();
    const { prompt, models, settings, includeVoting = false } = body;

    // Validate required fields
    if (!prompt || !models || models.length === 0) {
      return Response.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Prompt and models are required'
        }
      } as APIResponse, { status: 400 });
    }

    if (models.length > 8) {
      return Response.json({
        success: false,
        error: {
          code: 'TOO_MANY_MODELS',
          message: 'Maximum 8 models allowed for roundtable comparison'
        }
      } as APIResponse, { status: 400 });
    }

    const roundtableId = `roundtable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Execute all models simultaneously
    const responses: RoundtableResponse[] = await executeRoundtable(
      prompt,
      models,
      settings,
      roundtableId
    );

    // Calculate consensus and winner if voting enabled
    let winner: ModelId | undefined;
    let consensus: string | undefined;

    if (includeVoting && responses.length > 1) {
      const analysis = analyzeResponses(responses);
      winner = analysis.winner;
      consensus = analysis.consensus;
    }

    const totalTime = Date.now() - startTime;
    const totalCost = responses.reduce((sum, r) => sum + (r.metadata.cost || 0), 0);

    const result: RoundtableResult = {
      id: roundtableId,
      prompt,
      responses: responses.sort((a, b) => (b.ranking || 0) - (a.ranking || 0)),
      winner,
      consensus,
      timestamp: new Date(),
      totalCost,
      totalLatency: totalTime
    };

    return Response.json({
      success: true,
      data: result,
      metadata: {
        requestId: roundtableId,
        timestamp: new Date(),
        tokensUsed: responses.reduce((sum, r) => sum + (r.metadata.tokens || 0), 0),
        cost: totalCost
      }
    } as APIResponse);

  } catch (error) {
    console.error('Roundtable API error:', error);
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to execute roundtable comparison'
      }
    } as APIResponse, { status: 500 });
  }
}

async function executeRoundtable(
  prompt: string,
  models: ModelId[],
  settings: any,
  roundtableId: string
): Promise<RoundtableResponse[]> {
  // Create execution promises for all models
  const executionPromises = models.map(async (modelId, index) => {
    const messageId = `${roundtableId}_${modelId}_${index}`;
    const startTime = Date.now();

    try {
      // Import the chat route logic to reuse model execution
      const { executeNonStreamingRequest } = await import('./chat/route');
      
      // Mock session settings if not provided
      const sessionSettings = {
        temperature: settings?.temperature || 0.7,
        maxTokens: settings?.maxTokens || 2048,
        topP: settings?.topP,
        frequencyPenalty: settings?.frequencyPenalty,
        presencePenalty: settings?.presencePenalty,
        streaming: false,
        modelId: modelId,
        systemPrompt: settings?.systemPrompt,
        jsonMode: settings?.jsonMode,
        functionCalling: settings?.functionCalling
      };

      const response = await executeModelRequest(modelId, prompt, [], sessionSettings);
      const latency = Date.now() - startTime;
      const tokens = estimateTokens(response);

      const roundtableResponse: RoundtableResponse = {
        messageId,
        modelId,
        content: response,
        metadata: {
          tokens,
          cost: calculateCost(modelId, tokens),
          latency,
          finishReason: 'stop',
          requestId: messageId,
          cached: false
        },
        ranking: await calculateResponseRanking(response, prompt)
      };

      return roundtableResponse;

    } catch (error) {
      console.error(`Model ${modelId} failed in roundtable:`, error);
      
      // Return error response
      const errorResponse: RoundtableResponse = {
        messageId,
        modelId,
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          tokens: 0,
          cost: 0,
          latency: Date.now() - startTime,
          finishReason: 'stop',
          requestId: messageId,
          cached: false
        },
        ranking: 0
      };

      return errorResponse;
    }
  });

  // Execute all models in parallel with timeout
  const results = await Promise.allSettled(executionPromises);
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      // Handle promise rejection
      const modelId = models[index];
      const messageId = `${roundtableId}_${modelId}_${index}`;
      
      return {
        messageId,
        modelId,
        content: `Error: Request failed - ${result.reason}`,
        metadata: {
          tokens: 0,
          cost: 0,
          latency: 0,
          finishReason: 'stop',
          requestId: messageId,
          cached: false
        },
        ranking: 0
      };
    }
  });
}

async function executeModelRequest(
  modelId: ModelId,
  prompt: string,
  context: string[],
  settings: any
): Promise<string> {
  // Reuse the intelligent routing from model orchestrator
  try {
    const execution = await modelOrchestrator.executeWithFallback(
      async () => {
        // Mock the actual API call - in real implementation this would call the actual model
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
        return { content: `Response from ${modelId}: ${prompt.slice(0, 50)}...` };
      },
      modelId,
      { maxRetries: 2, fallbackEnabled: false } // No fallback in roundtable
    );

    return execution.result.content;
  } catch (error) {
    throw new Error(`Failed to execute ${modelId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function calculateResponseRanking(response: string, prompt: string): Promise<number> {
  // Simple ranking algorithm based on response quality metrics
  let score = 50; // Base score
  
  // Length factor (not too short, not too long)
  const wordCount = response.split(/\s+/).length;
  if (wordCount > 20 && wordCount < 500) score += 10;
  if (wordCount > 100 && wordCount < 300) score += 5; // Sweet spot
  
  // Coherence factor (simple heuristics)
  const sentences = response.split(/[.!?]+/).length;
  if (sentences > 2) score += 5;
  
  // Relevance factor (keyword matching)
  const promptWords = prompt.toLowerCase().split(/\s+/);
  const responseWords = response.toLowerCase().split(/\s+/);
  const matchingWords = promptWords.filter(word => 
    word.length > 3 && responseWords.some(rWord => rWord.includes(word))
  ).length;
  score += Math.min(matchingWords * 3, 15);
  
  // Structure factor (lists, formatting)
  if (response.includes('\n-') || response.includes('\n*')) score += 5;
  if (response.includes('\n\n')) score += 3; // Paragraphs
  
  // Avoid common error patterns
  if (response.toLowerCase().includes('error') || 
      response.toLowerCase().includes('sorry') ||
      response.toLowerCase().includes('cannot') ||
      response.toLowerCase().includes("don't know")) {
    score -= 20;
  }
  
  // Add some randomness to break ties
  score += Math.random() * 10;
  
  return Math.max(0, Math.min(100, score));
}

function analyzeResponses(responses: RoundtableResponse[]): {
  winner: ModelId;
  consensus: string;
} {
  // Find the highest ranked response
  const winner = responses.reduce((best, current) => 
    (current.ranking || 0) > (best.ranking || 0) ? current : best
  );

  // Generate consensus summary
  const successfulResponses = responses.filter(r => 
    !r.content.toLowerCase().includes('error') && (r.ranking || 0) > 30
  );

  let consensus: string;
  
  if (successfulResponses.length === 0) {
    consensus = "No models provided satisfactory responses.";
  } else if (successfulResponses.length === 1) {
    consensus = `Only ${successfulResponses[0].modelId} provided a good response.`;
  } else {
    // Find common themes
    const commonWords = findCommonThemes(successfulResponses.map(r => r.content));
    consensus = `${successfulResponses.length} models provided quality responses. ` +
               `Common themes: ${commonWords.slice(0, 5).join(', ')}.`;
  }

  return {
    winner: winner.modelId,
    consensus
  };
}

function findCommonThemes(responses: string[]): string[] {
  const wordCounts = new Map<string, number>();
  
  responses.forEach(response => {
    const words = response.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4); // Only meaningful words
    
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
  });
  
  // Find words that appear in multiple responses
  return Array.from(wordCounts.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([word, _]) => word);
}

// Utility functions (can be shared with chat route)
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
  return Math.ceil(text.length / 4);
}