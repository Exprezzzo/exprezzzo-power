// app/api/stripe/webhook/route.ts
// This file handles Stripe webhook events for post-payment and subscription updates.
// Corrected: Removed deprecated 'export const config' block for Next.js App Router.

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
// IMPORTANT: Ensure firebase-admin is installed: `npm install firebase-admin`
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (Singleton Pattern for Serverless)
// This MUST be initialized securely using service account credentials.
// Ensure FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID are set in Vercel Env Vars.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace `\n` in private key string with actual newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}
const db = admin.firestore(); // Get Firestore instance
// const authAdmin = admin.auth(); // Get Auth instance if needed

// Initialize Stripe with the Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10', // Use your Stripe API version (check your Stripe dashboard)
});

// This is the Webhook signing secret from your Stripe Dashboard (Developers -> Webhooks)
// Ensure STRIPE_WEBHOOK_SECRET is set in Vercel Environment Variables.
// This secret is used to verify the authenticity of incoming Stripe events.
const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET as string;

// --- REMOVED DEPRECATED `export const config` BLOCK ---
// Next.js App Router API Routes handle raw body automatically via `req.text()`.
// No explicit bodyParser config is needed here.

export async function POST(req: NextRequest) {
  // Get the raw body for Stripe signature verification
  const buf = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Stripe Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSession = event.data.object as Stripe.CheckoutSession;
      console.log(`[Stripe Webhook] Checkout session completed: ${checkoutSession.id}`);

      // --- Fulfill the customer's purchase here ---
      // This is where you grant "Power Access" to the user!
      try {
        // Ensure checkoutSession.client_reference_id contains the user's UID (from PaymentButton)
        const userId = checkoutSession.client_reference_id as string;
        const userEmail = checkoutSession.customer_details?.email;

        if (userId && userEmail) {
          const userRef = db.collection('users').doc(userId); // Assuming userId is Firebase UID
          await userRef.set({
            stripeCustomerId: checkoutSession.customer,
            subscriptionId: checkoutSession.subscription,
            subscriptionStatus: 'active',
            plan: 'Founding', // Or dynamically determine
            isPro: true,
            email: userEmail,
            lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          console.log(`[Firestore] User ${userId} (${userEmail}) granted Power Access.`);

          // Optional: Send a welcome email via Resend (ensure RESEND_API_KEY is set in Vercel)
          // Example:
          // if (process.env.RESEND_API_KEY) {
          //   await fetch('https://api.resend.com/emails', {
          //     method: 'POST',
          //     headers: {
          //       'Content-Type': 'application/json',
          //       'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
          //     },
          //     body: JSON.stringify({
          //       from: 'onboarding@exprezzzo.com', // Your verified Resend domain
          //       to: userEmail,
          //       subject: 'Welcome to Exprezzzo Power!',
          //       html: '<strong>Thanks for subscribing! Your power access is now active.</strong>',
          //     }),
          //   });
          // }

        } else {
          console.warn(`[Firestore] Missing client_reference_id or customer_details.email for checkout session ${checkoutSession.id}. User not updated.`);
        }

      } catch (updateError) {
        console.error(`[Firestore/Resend Error] Failed to update user or send email for ${checkoutSession.client_reference_id}:`, updateError);
        // Consider logging this to an error tracking service (e.g., PostHog, Sentry)
      }
      break;

    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Subscription updated: ${subscriptionUpdated.id}. Status: ${subscriptionUpdated.status}`);
      // Update user's subscription status in Firestore
      if (subscriptionUpdated.customer && typeof subscriptionUpdated.customer === 'string') {
        // You'll need to link Stripe Customer ID to your internal user ID
        // Find user by stripeCustomerId if stored, or by email.
        // For simplicity, let's assume client_reference_id was user ID.
        const checkoutSessionId = (event.request as any)?.idempotency_key; // Get original Checkout Session ID
        const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId);
        const userId = checkoutSession.client_reference_id as string;

        if (userId) {
          const userRef = db.collection('users').doc(userId);
          await userRef.update({
            subscriptionStatus: subscriptionUpdated.status,
            plan: subscriptionUpdated.metadata?.plan_name || 'Founding',
          });
          console.log(`[Firestore] User ${userId} subscription status updated to ${subscriptionUpdated.status}`);
        } else {
           console.warn(`[Firestore] Could not find user for subscription update: ${subscriptionUpdated.id}`);
        }
      }
      break;

    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Subscription deleted: ${subscriptionDeleted.id}.`);
      // Revoke access or set user status to inactive in your database
      if (subscriptionDeleted.customer && typeof subscriptionDeleted.customer === 'string') {
         // Link Stripe Customer ID to your internal user ID
        const checkoutSessionId = (event.request as any)?.idempotency_key;
        const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId);
        const userId = checkoutSession.client_reference_id as string;

        if (userId) {
          const userRef = db.collection('users').doc(userId);
          await userRef.update({
            subscriptionStatus: 'inactive',
            isPro: false,
          });
          console.log(`[Firestore] User ${userId} access revoked.`);
        } else {
           console.warn(`[Firestore] Could not find user for subscription deletion: ${subscriptionDeleted.id}`);
        }
      }
      break;

    // Add more event handlers as needed (e.g., 'invoice.payment_succeeded', 'invoice.payment_failed')
    default:
      console.warn(`[Stripe Webhook] Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}