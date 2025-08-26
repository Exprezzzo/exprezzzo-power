<<<<<<< HEAD
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'alive',
    deployedAt: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID || 'unknown',
    cache: process.env.VERCEL_FORCE_NO_BUILD_CACHE === '1' ? 'bypassed' : 'enabled',
    project: 'exprezzzo-power',
    message: 'AI chat platform operational'
  });
}
=======
// app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Fast cold starts
export const maxDuration = 10; // Timeout protection

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  // Initialize health checks
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      mcp_unified: false,
      orchestrate_v2: false,
      providers: 0
    },
    latency: {
      total: 0,
      mcp: 0,
      orchestrate: 0
    }
  };

  // Parallel health checks with timeout protection
  const checkPromises = [
    // MCP Unified check
    Promise.race([
      fetch(`${getBaseUrl(req)}/api/mcp-unified`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5s timeout
      }).then(res => {
        checks.services.mcp_unified = res.ok;
        checks.latency.mcp = Date.now() - startTime;
        return res.ok;
      }).catch(() => false),
      new Promise(resolve => setTimeout(() => resolve(false), 5000))
    ]),
    
    // Orchestrate v2 check (lightweight test)
    Promise.race([
      fetch(`${getBaseUrl(req)}/api/orchestrate-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.HEALTH_CHECK_API_KEY || process.env.EXPREZZZO_API_KEY || ''
        },
        body: JSON.stringify({
          prompt: 'health_check',
          providers: ['groq'],
          maxTokens: 1 // Minimal to avoid cost
        }),
        signal: AbortSignal.timeout(5000)
      }).then(res => {
        checks.services.orchestrate_v2 = res.ok;
        checks.latency.orchestrate = Date.now() - startTime;
        return res.ok;
      }).catch(() => false),
      new Promise(resolve => setTimeout(() => resolve(false), 5000))
    ])
  ];

  // Execute checks in parallel
  await Promise.allSettled(checkPromises);
  
  // Calculate overall health
  checks.latency.total = Date.now() - startTime;
  const allHealthy = checks.services.mcp_unified && checks.services.orchestrate_v2;
  checks.status = allHealthy ? 'healthy' : 'degraded';
  
  // Return response with appropriate status code
  return NextResponse.json(checks, {
    status: allHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': `${checks.latency.total}ms`
    }
  });
}

// Helper to get base URL
function getBaseUrl(req: NextRequest): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}
>>>>>>> 9546d38bc316d4b5cda95adb16e8225b83af8175
