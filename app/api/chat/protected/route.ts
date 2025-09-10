import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie, getUserMetrics, updateUserCost, checkMarginThreshold, getSubscriptionInfo } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

// Mock AI model costs (per 1K tokens)
const MODEL_COSTS = {
  'gpt-4-turbo': 0.030,
  'claude-3-sonnet': 0.015,
  'gemini-pro': 0.0005,
  'gpt-3.5-turbo': 0.002,
};

export async function POST(request: NextRequest) {
  try {
    const { prompt, model = 'gpt-4-turbo', roundtable = false } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Verify session
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const sessionResult = await verifySessionCookie(sessionCookie);
    if (!sessionResult.success || !sessionResult.decodedClaims) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const uid = sessionResult.decodedClaims.uid;

    // Get subscription info
    const subscription = await getSubscriptionInfo(uid);
    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Active subscription required' },
        { status: 403 }
      );
    }

    // Calculate estimated cost
    const estimatedTokens = Math.ceil(prompt.length / 4); // Rough estimation
    const modelsToUse = roundtable ? ['gpt-4-turbo', 'claude-3-sonnet', 'gemini-pro'] : [model];
    const totalEstimatedCost = modelsToUse.reduce((sum, m) => 
      sum + (MODEL_COSTS[m as keyof typeof MODEL_COSTS] || 0.01) * (estimatedTokens / 1000), 0);

    // Check margin threshold BEFORE making API calls
    const marginOk = await checkMarginThreshold(uid, 50); // 50% minimum margin
    if (!marginOk) {
      return NextResponse.json(
        { 
          error: 'Usage limit reached',
          message: 'Your usage has reached the cost threshold. Please upgrade or contact support.',
          code: 'MARGIN_EXCEEDED'
        },
        { status: 429 }
      );
    }

    // Simulate AI API calls (in production, this would call actual APIs)
    const responses = await Promise.all(
      modelsToUse.map(async (modelName) => {
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
          
          const tokens = estimatedTokens + Math.floor(Math.random() * 200);
          const cost = (MODEL_COSTS[modelName as keyof typeof MODEL_COSTS] || 0.01) * (tokens / 1000);
          
          // Update user cost tracking
          await updateUserCost(uid, cost, subscription.value);

          return {
            model: modelName,
            response: `This is a simulated response from ${modelName}. In production, this would be the actual AI response.`,
            tokens,
            cost,
            responseTime: 1.0 + Math.random() * 2.0,
            success: true,
          };
        } catch (error) {
          console.error(`Error with ${modelName}:`, error);
          return {
            model: modelName,
            response: null,
            error: 'Model temporarily unavailable',
            success: false,
          };
        }
      })
    );

    // Implement retry logic for failed models
    const failedModels = responses.filter(r => !r.success);
    const retryResponses = await Promise.all(
      failedModels.map(async (failed) => {
        // Try fallback models: GPT-4 -> Claude -> GPT-3.5
        const fallbackChain = ['gpt-4-turbo', 'claude-3-sonnet', 'gpt-3.5-turbo'];
        const fallbackModel = fallbackChain.find(m => m !== failed.model);
        
        if (fallbackModel) {
          try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Shorter retry delay
            
            const tokens = estimatedTokens;
            const cost = (MODEL_COSTS[fallbackModel as keyof typeof MODEL_COSTS] || 0.01) * (tokens / 1000);
            
            await updateUserCost(uid, cost, subscription.value);

            return {
              ...failed,
              model: fallbackModel,
              response: `Fallback response from ${fallbackModel}`,
              tokens,
              cost,
              success: true,
              fallback: true,
            };
          } catch (retryError) {
            return failed;
          }
        }
        
        return failed;
      })
    );

    // Merge successful responses with retries
    const finalResponses = responses.map((response, index) => {
      if (!response.success && retryResponses[index] && retryResponses[index].success) {
        return retryResponses[index];
      }
      return response;
    });

    // Get updated metrics for response
    const updatedMetrics = await getUserMetrics(uid);

    return NextResponse.json({
      success: true,
      responses: finalResponses,
      totalCost: finalResponses.reduce((sum, r) => sum + (r.cost || 0), 0),
      userMetrics: updatedMetrics,
      roundtable,
    });

  } catch (error) {
    console.error('Protected chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Middleware for session verification (can be used by other protected routes)
export async function verifyUserSession(request: NextRequest) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return { success: false, error: 'No session found' };
  }

  const sessionResult = await verifySessionCookie(sessionCookie);
  if (!sessionResult.success || !sessionResult.decodedClaims) {
    return { success: false, error: 'Invalid session' };
  }

  return { 
    success: true, 
    uid: sessionResult.decodedClaims.uid,
    claims: sessionResult.decodedClaims 
  };
}