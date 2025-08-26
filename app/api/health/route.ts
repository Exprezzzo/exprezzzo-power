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
