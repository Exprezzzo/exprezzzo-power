// app/api/stripe/webhook/route.ts
// Implements Phoenix v3.4 Fixes:
// - Explicitly sets Node.js runtime
// - Correctly handles raw request body and base64 decoding for Stripe webhook signature verification
// - Uses Firebase Admin SDK for secure user creation/linking

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminApp, getAdminFirestore } from '@/lib/firebaseAdmin'; // Import getAdminApp, getAdminFirestore
import { getAuth as getAdminAuth } from 'firebase-admin/auth'; // Import admin Auth
import { getAdminApp, getAdminFirestore } from '@/lib/firebaseAdmin'; // Import getAdminApp, getAdminFirestore
import { getAuth as getAdminAuth } from 'firebase-admin/auth'; // Import admin Auth
// Removed the unused FieldValue import
// Phoenix v3.4: Explicitly set runtime for Node.js environment
export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use a stable API version
});

// Phoenix v3.4: Crucial: Disable default body parsing for webhook
// This config is typically needed for Pages Router. For App Router, request.text() handles it.
// However, if your Vercel setup still has issues, it's a good explicit declaration.
// In Next.js 14 App Router, `request.text()` implicitly sets body parsing to raw.
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };


export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Webhook Error: Missing signature or webhook secret.');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Phoenix v3.4: Ensure Firebase Admin SDK is initialized
  const adminApp = getAdminApp();
  const adminFirestore = getAdminApp() ? getAdminFirestore() : null;
  const adminAuth = getAdminApp() ? getAdminAuth(getAdminApp()!) : null; // Get adminAuth if app exists

  if (!adminApp || !adminFirestore || !adminAuth) {
    console.error("Webhook: Firebase Admin SDK not fully initialized. Cannot process user data securely.");
    return NextResponse.json({ error: "Server configuration error in webhook." }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    // Phoenix v3.4: Retrieve raw body using request.text()
    const rawBody = await req.text();

    // Phoenix v3.4: Conditionally base64 decode if Vercel has encoded it
    const parsedBody = (req as any).isBase64Encoded // Check for Vercel specific encoding
      ? Buffer.from(rawBody, 'base64').toString('utf-8')
      : rawBody;

    event = stripe.webhooks.constructEvent(
      parsedBody, // Use the (potentially decoded) raw body
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log(`Stripe Webhook: Event type ${event.type} received and signature verified.`);

  } catch (err: any) {
    console.error('Stripe Webhook signature verification failed:', err.message, err.stack);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Webhook: checkout.session.completed received for session', session.id);

        if (!session.customer_email || !session.customer || !session.subscription) {
            console.error('Webhook: Missing essential data in checkout.session.completed', { email: session.customer_email, customer: session.customer, subscription: session.subscription });
            return NextResponse.json({ error: 'Missing session data' }, { status: 400 });
        }

        let firebaseUid = session.metadata?.firebaseUid;
        let userDocRef;

        // Phoenix v3.4: Securely handle Guest Checkout / User Creation or Linking using Firebase Admin SDK
        if (!firebaseUid || firebaseUid === 'guest') {
            console.log(`Webhook: Guest checkout detected for ${session.customer_email}. Attempting to create or link Firebase user with Admin SDK.`);
            try {
                const userRecord = await adminAuth.getUserByEmail(session.customer_email);
                firebaseUid = userRecord.uid; // User exists in Firebase Auth
                console.log(`Webhook: Found existing Firebase user by email: ${firebaseUid}`);
            } catch (authError: any) {
                if (authError.code === 'auth/user-not-found') {
                    // User does not exist, create a new Firebase Auth user with Admin SDK
                    const newUserRecord = await adminAuth.createUser({
                        email: session.customer_email,
                        emailVerified: true, // Mark as verified since payment is confirmed
                        displayName: session.customer_details?.name || session.customer_email.split('@')[0],
                    });
                    firebaseUid = newUserRecord.uid;
                    console.log(`Webhook: Created new Firebase user for guest: ${firebaseUid}`);
                    // TODO: Consider sending a welcome email with a password reset link to new users created here (via Resend)
                } else {
                    console.error('Webhook: Error fetching/creating Firebase user by email in Admin SDK:', authError);
                    throw new Error(`Firebase Auth error for guest checkout: ${authError.message}`);
                }
            }
        }

        // Phoenix v3.4: Update User Document in Firestore using Admin SDK
        if (firebaseUid) {
          userDocRef = adminFirestore.collection('users').doc(firebaseUid);
          await userDocRef.set({
            email: session.customer_email,
            isPro: true, // Mark as Pro
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            subscriptionStatus: 'active', // Set to active immediately on completion
            planType: session.metadata?.planType || 'monthly', // Get plan type from metadata
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          console.log(`Webhook: User ${firebaseUid} subscription set to active in Firestore.`);
        } else {
            console.error('Webhook: Firebase UID is null after guest checkout processing. Cannot update user document.');
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Stripe Webhook: ${event.type} received for subscription ${subscription.id}`);

        // Find user by stripe customer ID in Firestore (Admin SDK)
        const usersCollection = adminFirestore.collection('users');
        const userQuery = usersCollection.where('stripeCustomerId', '==', subscription.customer).limit(1);
        const querySnapshot = await userQuery.get();

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          await userDoc.ref.set({
            subscriptionStatus: subscription.status,
            isPro: subscription.status === 'active' || subscription.status === 'trialing', // Update isPro based on status
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          console.log(`Webhook: User ${userDoc.id} subscription status updated to: ${subscription.status}. isPro: ${subscription.status === 'active'}.`);
        } else {
          console.warn(`Webhook: No user found in Firestore with stripeCustomerId: ${subscription.customer}`);
        }
        break;

      case 'invoice.payment_succeeded':
        // Handle successful invoice payments (e.g., update user credits, send receipt)
        console.log('Webhook: Invoice payment succeeded:', (event.data.object as Stripe.Invoice).id);
        break;

      case 'invoice.payment_failed':
        // Handle failed invoice payments (e.g., notify user, update subscription status to 'past_due' or 'unpaid')
        console.warn('Webhook: Invoice payment failed:', (event.data.object as Stripe.Invoice).id);
        break;

      default:
        console.log(`Webhook: Unhandled event type ${event.type}.`);
    }

    // Phoenix v3.4: Always return 200 OK quickly for Stripe webhooks
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err: any) {
    console.error('Stripe Webhook handler failed:', err.message, err.stack);
    // Do NOT return anything other than 200 for internal errors to Stripe, or it will retry
    return NextResponse.json(
      { error: 'Webhook handler internal error' }, // Generic error for Stripe
      { status: 500 } // Indicate server error, but Stripe will retry
    );
  }
}
