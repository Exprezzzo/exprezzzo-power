// app/api/debug-env/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10),
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasFirebaseKeys: {
      projectId: !!process.env.FIREBASE_PROJECT_ID,
      clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    },
    publicKeys: {
      stripePublishable: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      firebaseConfig: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    },
  });
}
