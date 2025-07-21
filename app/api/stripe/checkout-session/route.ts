// app/api/stripe/checkout-session/route.ts
// This file will handle the Stripe Checkout Session creation.
// It replaces the Express.js backend route for this functionality.

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with the Secret Key
// Ensure STRIPE_SECRET_KEY is set in Vercel Environment Variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10', // Use your Stripe API version
});

// This function handles POST requests to create a Stripe Checkout Session
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { priceId, quantity = 1, successUrl, cancelUrl, userId, userEmail } = await req.json();

    // --- Input Validation (CRITICAL for security & stability) ---
    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json({ error: 'Invalid priceId provided' }, { status: 400 });
    }
    // Add more validation as per your needs (e.g., quantity validation)

    // Define success and cancel URLs based on your frontend domain
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL // Vercel's default env var for deployed URL
                  || process.env.NEXT_PUBLIC_FRONTEND_URL // Your custom env var if set
                  || 'http://localhost:3000'; // Fallback for local development

    const actualSuccessUrl = `${baseUrl}/success`; // Or wherever your success page is
    const actualCancelUrl = `${baseUrl}/cancel`;   // Or wherever your cancel page is

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId, // This should be a Stripe Price ID (e.g., 'price_12345')
          quantity: quantity,
        },
      ],
      mode: 'subscription', // or 'payment' if it's a one-time purchase
      success_url: actualSuccessUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: actualCancelUrl,
      // Optional: Pre-fill customer email
      customer_email: userEmail,
      // Optional: Add client reference ID for linking to your user
      client_reference_id: userId,
      // If you need more complex behavior (e.g., allowing promo codes), add here
      // allow_promotion_codes: true,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url }, { status: 200 });

  } catch (error: any) {
    console.error('Stripe Checkout Session creation failed:', error);
    // Provide more specific error messages in production if needed,
    // but avoid exposing sensitive details.
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    );
  }
}