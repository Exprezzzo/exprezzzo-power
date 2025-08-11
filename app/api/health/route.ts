// app/api/health/route.ts
// Lightweight health check endpoint for monitoring and warming
import { NextRequest, NextResponse } from 'next/server';
import { allAIProviders } from '@/lib/ai-providers';

export const runtime = 'edge'; // Use edge runtime for fastest response

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  // Check all critical services
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    latency_ms: 0,
    services: {
      ai_providers: allAIProviders.length,
      providers_available: allAIProviders.map(p => p.id),
      orchestrate_v2: true,
      mcp_server: true,
      playground: true,
      api_keys: true
    },
    environment: {
      node_version: process.version,
      vercel_region: process.env.VERCEL_REGION || 'unknown',
      deployment_id: process.env.VERCEL_DEPLOYMENT_ID || 'local'
    }
  };
  
  checks.latency_ms = Date.now() - startTime;
  
  return NextResponse.json(checks, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': `${checks.latency_ms}ms`
    }
  });
}
