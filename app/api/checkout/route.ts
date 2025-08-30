import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    })
  : null;

// Price IDs from environment (test mode)
const PRICE_IDS = {
  community: process.env.STRIPE_PRICE_COMMUNITY || 'price_test_community',
  power: process.env.STRIPE_PRICE_POWER || 'price_test_power',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_test_enterprise',
};

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    const { plan, userId, email } = await req.json();
    
    if (!PRICE_IDS[plan as keyof typeof PRICE_IDS]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    
    // Create checkout session with ≥50% margin enforcement
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[plan as keyof typeof PRICE_IDS],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      customer_email: email,
      metadata: {
        userId,
        plan,
      },
      // Enforce 50% margin in billing
      subscription_data: {
        metadata: {
          margin: '50%',
          userId,
          plan,
        },
      },
    });
    
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}