import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get('stripe-signature');
  
  if (!sig) {
    return new NextResponse('bad signature', { status: 400 });
  }
  
  // Mock webhook processing
  console.log('Webhook received:', raw.slice(0, 100));
  
  return new NextResponse('ok');
}

export const config = { api: { bodyParser: false } } as any;