// app/api/stripe/checkout-session/route.ts
// Corrected: Uses dynamic price creation (price_data) instead of a pre-defined Stripe Price ID.

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with the Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10', // Use your Stripe API version (check your Stripe dashboard)
});

export async function POST(req: NextRequest) {
  try {
    // userId and email might come from your frontend if user is logged in
    const { userId, email } = await req.json();

    // --- Basic Input Validation ---
    // (Optional: You can add more checks for userId/email if needed)

    // Construct the base URL using headers for reliability in Vercel serverless environment.
    const scheme = req.headers.get('x-forwarded-proto') || 'https'; // Default to https
    const host = req.headers.get('host');

    let deployedBaseUrl;
    if (host) {
      deployedBaseUrl = `${scheme}://${host}`;
    } else if (process.env.VERCEL_URL) {
      deployedBaseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      deployedBaseUrl = 'http://localhost:3000'; // Fallback for local development
      console.warn("Using localhost for base URL - ensure this is only for local dev.");
    }

    const successUrl = `${deployedBaseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${deployedBaseUrl}/cancel`;

    // --- KEY CHANGE: Use price_data for dynamic price creation ---
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: { // Define the price directly here
            currency: 'usd',
            product_data: {
              name: 'Exprezzzo Power User Access', // Name of your product
              description: 'Premium access to all Exprezzzo AI features ($97/month)', // Product description
              images: [`${deployedBaseUrl}/ExprezzzoLogo.png`], // Optional: URL to your product image (ensure it's in /public)
            },
            unit_amount: 9700, // Price in cents: $97.00
            recurring: {
              interval: 'month', // Monthly subscription
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription', // This must be 'subscription' for recurring payments
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email, // Pre-fill email if provided
      client_reference_id: userId, // Link to your internal user ID
      allow_promotion_codes: true, // Allow promo codes
      // Add any other necessary Stripe Checkout Session parameters as needed
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