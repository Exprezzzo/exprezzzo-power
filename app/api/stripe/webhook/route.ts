// app/api/stripe/webhook/route.ts
// This file handles Stripe webhook events for post-payment actions.

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
// import { buffer } from 'micro'; // 'micro' is not typically needed for Next.js App Router
// Next.js Route Handlers provide req.text() for raw body

// Initialize Stripe with the Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10', // Use your Stripe API version
});

// This is the Webhook signing secret from your Stripe Dashboard (Developers -> Webhooks)
// Ensure STRIPE_WEBHOOK_SECRET is set in Vercel Environment Variables
const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET!;

// We need to disable the default bodyParser for this route
// as Stripe webhooks require the raw body for signature verification.
// In Next.js App Router, you can read the raw body directly.
export const config = {
  api: {
    bodyParser: false, // This is actually the default for App Router Route Handlers.
                      // You might not need this config object explicitly.
  },
};

export async function POST(req: NextRequest) {
  // Get the raw body
  const buf = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSession = event.data.object as Stripe.CheckoutSession;
      // Here, you would fulfill the customer's purchase:
      // - Grant "Power Access" to the user in your Firebase/Firestore database.
      // - Send a welcome email.
      // - Update subscription status for the user (e.g., set `isPro: true` in Firestore).
      console.log(`Checkout session completed for user: ${checkoutSession.client_reference_id} / ${checkoutSession.customer_email}`);
      // Example: Update user in Firestore (requires Firebase Admin SDK in this API route)
      // import { db } from '@/lib/firebaseAdmin'; // Assuming you have firebaseAdmin init logic
      // await db.collection('users').doc(checkoutSession.client_reference_id as string).update({
      //   stripeCustomerId: checkoutSession.customer,
      //   subscriptionStatus: 'active',
      //   plan: checkoutSession.metadata?.plan_name || 'Founding', // Or based on line_items
      //   isPro: true,
      // });
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;
      // Update user's subscription status in your database
      console.log(`Subscription ${subscription.id} updated for customer ${subscription.customer}. Status: ${subscription.status}`);
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      // Revoke access or set user status to inactive in your database
      console.log(`Subscription ${deletedSubscription.id} deleted for customer ${deletedSubscription.customer}.`);
      break;

    // ... handle other event types
    default:
      console.warn(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}