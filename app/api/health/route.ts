import { NextResponse } from 'next/server';
import { ProviderRouter } from '@/lib/providers/router';
import { HouseConnector } from '@/lib/sovereign/house-connector';
import { isSovereignMode } from '@/lib/flags';

export async function GET() {
  const router = new ProviderRouter();
  const status = router.getHealthStatus();
  
  // 🏠 House Prep: Include sovereign status
  let sovereignStatus = null;
  if (isSovereignMode()) {
    const houseConnector = HouseConnector.getInstance();
    sovereignStatus = houseConnector.getStatus();
  }
  
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    providers: status.providers,
    metrics: status.metrics,
    sovereign: sovereignStatus, // 🏠 Will be null until HOUSE is deployed
    build: {
      product: 'EXPREZZZ POWER', // Note: 3 Z's
      version: 'v1.1',
      houseReady: true, // 🏠 Prepared for EXPRESSO LLM HOUSE
    }
  });
}