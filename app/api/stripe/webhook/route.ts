// app/api/stripe/webhook/route.ts
// Updated: Adds handling for 'customer.subscription.created' event.

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db, admin } from '@/lib/firebaseAdmin'; // Ensure 'admin' is imported

// Initialize Stripe with the Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10', // Use your Stripe API version (check your Stripe dashboard)
});

// Webhook signing secret from your Stripe Dashboard
const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: NextRequest) {
  const buf = await req.text(); // Get the raw request body
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Stripe Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSession = event.data.object as Stripe.CheckoutSession;
      console.log(`[Stripe Webhook] Checkout session completed: ${checkoutSession.id}`);

      try {
        const userId = checkoutSession.client_reference_id as string;
        const userEmail = checkoutSession.customer_details?.email;

        if (userId && userEmail) {
          const userRef = db.collection('users').doc(userId);
          await userRef.set({
            stripeCustomerId: checkoutSession.customer,
            subscriptionId: checkoutSession.subscription,
            subscriptionStatus: 'active',
            plan: 'Founding',
            isPro: true,
            email: userEmail,
            lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(), // 'admin' now correctly referenced
          }, { merge: true });
          console.log(`[Firestore] User ${userId} (${userEmail}) granted Power Access.`);
        } else {
          console.warn(`[Firestore] Missing client_reference_id or customer_details.email for checkout session ${checkoutSession.id}. User not updated.`);
        }
      } catch (updateError) {
        console.error(`[Firestore Error] Failed to update user or send email for ${checkoutSession.client_reference_id}:`, updateError);
      }
      break;

    case 'customer.subscription.created': // ADDED THIS CASE
      const subscriptionCreated = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Subscription created: ${subscriptionCreated.id}. Status: ${subscriptionCreated.status}`);
      // This event is often sent right after checkout.session.completed.
      // You can use it to re-confirm subscription status or perform additional actions.
      if (subscriptionCreated.customer && typeof subscriptionCreated.customer === 'string') {
        const usersSnapshot = await db.collection('users').where('stripeCustomerId', '==', subscriptionCreated.customer).limit(1).get();
        if (!usersSnapshot.empty) {
          await usersSnapshot.docs[0].ref.update({
            subscriptionStatus: subscriptionCreated.status,
            plan: subscriptionCreated.metadata?.plan_name || 'Founding',
            // You might also update isPro: true here if not done by checkout.session.completed
          });
          console.log(`[Firestore] User ${usersSnapshot.docs[0].id} subscription status updated to ${subscriptionCreated.status}`);
        }
      }
      break;

    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Subscription updated: ${subscriptionUpdated.id}. Status: ${subscriptionUpdated.status}`);
      if (subscriptionUpdated.customer && typeof subscriptionUpdated.customer === 'string') {
        const usersSnapshot = await db.collection('users').where('stripeCustomerId', '==', subscriptionUpdated.customer).limit(1).get();
        if (!usersSnapshot.empty) {
          await usersSnapshot.docs[0].ref.update({
            subscriptionStatus: subscriptionUpdated.status,
            plan: subscriptionUpdated.metadata?.plan_name || 'Founding',
          });
          console.log(`[Firestore] User ${usersSnapshot.docs[0].id} subscription status updated to ${usersSnapshot.docs[0].data().email} to ${subscriptionUpdated.status}`);
        }
      }
      break;

    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Subscription deleted: ${subscriptionDeleted.id}.`);
      if (subscriptionDeleted.customer && typeof subscriptionDeleted.customer === 'string') {
        const usersSnapshot = await db.collection('users').where('stripeCustomerId', '==', subscriptionDeleted.customer).limit(1).get();
        if (!usersSnapshot.empty) {
          await usersSnapshot.docs[0].ref.update({
            subscriptionStatus: 'inactive',
            isPro: false,
          });
          console.log(`[Firestore] User ${usersSnapshot.docs[0].id} access revoked.`);
        }
      }
      break;

    default:
      console.warn(`[Stripe Webhook] Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}