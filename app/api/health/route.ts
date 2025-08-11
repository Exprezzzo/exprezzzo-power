// app/api/health/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      mcp_unified: await checkService('/api/mcp-unified'),
      orchestrate_v2: await checkService('/api/orchestrate-v2', 'POST'),
      playground: true,
      api_keys: true
    },
    environment: {
      github_token: !!process.env.GITHUB_TOKEN,
      figma_token: !!process.env.FIGMA_API_KEY,
      exprezzzo_key: !!process.env.EXPREZZZO_API_KEY
    }
  };

  return NextResponse.json(checks);
}

async function checkService(path: string, method: string = 'GET') {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://exprezzzo-power.vercel.app'}${path}`,
      {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(method === 'POST' ? { body: JSON.stringify({ test: true }) } : {})
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
