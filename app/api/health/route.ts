// app/api/health/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      mcp_unified: await checkMCPHealth(),
      orchestrate_v2: await checkOrchestrateHealth(),
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

async function checkMCPHealth() {
  try {
    const res = await fetch('http://localhost:3000/api/mcp-unified');
    return res.ok;
  } catch {
    return false;
  }
}

async function checkOrchestrateHealth() {
  try {
    const res = await fetch('http://localhost:3000/api/orchestrate-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    return res.ok;
  } catch {
    return false;
  }
}
