// app/api/stripe/checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminApp, getAdminFirestore } from '@/lib/firebaseAdmin';

// CRITICAL: Force Node.js runtime for Firebase Admin SDK
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Stripe with explicit configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion,
  typescript: true,
  maxNetworkRetries: 2,
  timeout: 20000, // 20 seconds
});

export async function POST(req: NextRequest) {
  try {
    // Environment validation
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not found in environment');
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { priceId, userId, userEmail } = body;

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required.' }, { status: 400 });
    }

    // Initialize Firebase Admin
    const adminApp = getAdminApp();
    const adminFirestore = getAdminFirestore();

    if (!adminApp || !adminFirestore) {
      console.error("Firebase Admin SDK not initialized");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    let customerId: string | undefined;

    // Handle customer creation/retrieval
    if (userId) {
      const userRef = adminFirestore.collection('users').doc(userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      if (userDoc.exists && userData?.stripeCustomerId) {
        customerId = userData.stripeCustomerId as string;
        console.log(`Using existing Stripe customer for user ${userId}: ${customerId}`);
      } else {
        const customer = await stripe.customers.create({
          email: userEmail || undefined,
          metadata: { firebaseUid: userId },
        });
        customerId = customer.id;
        await userRef.set({ stripeCustomerId: customer.id }, { merge: true });
        console.log(`Created new Stripe customer for user ${userId}: ${customerId}`);
      }
    } else if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log(`Using existing Stripe customer for guest: ${customerId}`);
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { guestEmail: userEmail }
        });
        customerId = customer.id;
        console.log(`Created new Stripe customer for guest: ${customerId}`);
      }
    }

    // Get dynamic URLs
    const origin = req.headers.get('origin') || 
                   req.headers.get('x-forwarded-host') ? `https://${req.headers.get('x-forwarded-host')}` : 
                   process.env.NEXT_PUBLIC_APP_URL || 
                   'https://exprezzzo-power.vercel.app';

    const successUrl = `${origin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/pricing`;

    console.log('Creating checkout session with URLs:', { successUrl, cancelUrl });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: customerId,
      customer_email: !customerId ? userEmail || undefined : undefined,
      client_reference_id: userId || undefined,
      metadata: {
        firebaseUid: userId || 'guest',
        timestamp: new Date().toISOString(),
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new Error('Stripe session URL not created');
    }

    console.log(`Checkout session created: ${session.id}`);
    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
    });

    return NextResponse.json(
      { 
        error: error.message || 'Payment system temporarily unavailable',
        code: error.code,
        type: error.type,
      },
      { status: error.statusCode || 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}