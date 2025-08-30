import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    })
  : null;

export async function POST(req: NextRequest) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  
  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutComplete(session);
        break;
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 });
  }
}

async function handleCheckoutComplete(session: any) {
  // Update user subscription in Firestore
  console.log('Checkout completed:', session.id);
}

async function handlePaymentSuccess(paymentIntent: any) {
  // Log successful payment
  console.log('Payment succeeded:', paymentIntent.id);
}