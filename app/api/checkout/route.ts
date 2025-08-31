import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { priceId, userId } = await req.json();
  
  // Mock Stripe checkout URL for now
  const checkoutUrl = `https://checkout.stripe.com/c/pay/mock_${priceId}_${userId}`;
  
  return NextResponse.json({ 
    url: checkoutUrl,
    sessionId: 'cs_mock_' + Date.now()
  });
}