// app/api/stripe/checkout-session/route.ts
// Corrected: Ensure success_url and cancel_url have explicit 'https://' scheme.

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with the Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10', // Use your Stripe API version (check your Stripe dashboard)
});

export async function POST(req: NextRequest) {
  try {
    const { priceId, quantity = 1, userId, userEmail } = await req.json();

    // --- Basic Input Validation (IMPORTANT for security) ---
    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json({ error: 'Invalid priceId provided' }, { status: 400 });
    }
    if (quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 });
    }

    // --- DEFINITIVE FIX FOR THE INVALID URL ERROR ---
    // Construct the base URL using headers for reliability in Vercel serverless environment.
    // 'x-forwarded-proto' gives 'http' or 'https', 'host' gives the domain.
    const scheme = req.headers.get('x-forwarded-proto') || 'https'; // Default to https
    const host = req.headers.get('host');

    // Check if host is available and construct base URL
    let deployedBaseUrl;
    if (host) {
      deployedBaseUrl = `${scheme}://${host}`;
    } else if (process.env.VERCEL_URL) {
      // Fallback to VERCEL_URL environment variable if headers are somehow missing (unlikely in Vercel)
      deployedBaseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      // Last resort fallback for local development if nothing else is available
      deployedBaseUrl = 'http://localhost:3000';
      console.warn("Using localhost for base URL - ensure this is only for local dev.");
    }

    const successUrl = `${deployedBaseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${deployedBaseUrl}/cancel`;

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      mode: 'subscription', // or 'payment'
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail,
      client_reference_id: userId,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url }, { status: 200 });

  } catch (error: any) {
    console.error('Stripe Checkout Session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    );
  }
}