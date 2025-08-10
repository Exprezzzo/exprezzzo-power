// app/api/test-providers/route.ts
// Debug endpoint to test provider configuration

import { NextRequest, NextResponse } from 'next/server';
import { allAIProviders, testProvider } from '@/lib/ai-providers';

export async function GET(req: NextRequest) {
  // Check environment
  const env = {
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    openAIKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10),
    hasGroq: !!process.env.GROQ_API_KEY,  
    groqKeyPrefix: process.env.GROQ_API_KEY?.substring(0, 10),
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
    anthropicKeyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 10),
    hasGemini: !!process.env.GOOGLE_AI_API_KEY,
    geminiKeyPrefix: process.env.GOOGLE_AI_API_KEY?.substring(0, 10),
  };

  // Check loaded providers
  const providers = allAIProviders.map(p => ({
    id: p.id,
    name: p.name
  }));

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: env,
    loadedProviders: providers,
    providerCount: providers.length,
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV
  });
}

export async function POST(req: NextRequest) {
  try {
    const { provider = 'groq', prompt = 'Hello, test!' } = await req.json();
    
    console.log(`[Test] Testing provider ${provider} with prompt: ${prompt}`);
    
    // Test the provider
    const result = await testProvider(provider, prompt);
    
    return NextResponse.json({
      success: true,
      provider,
      prompt,
      response: result,
      responseLength: result.length,
      availableProviders: allAIProviders.map(p => p.id)
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      availableProviders: allAIProviders.map(p => p.id)
    }, { status: 500 });
  }
}
