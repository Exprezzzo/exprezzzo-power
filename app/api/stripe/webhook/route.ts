// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminApp } from '@/lib/firebaseAdmin'; // Ensure this is correctly imported
import { getFirestore, doc, setDoc } from 'firebase/firestore'; // Import Firestore functions

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use a recent API version
});

export async function POST(req: NextRequest) {
  const adminApp = getAdminApp(); // Lazy initialization
  const firestore = getFirestore(adminApp);

  const buf = await req.text();
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret!);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.CheckoutSession;
        const customerId = checkoutSession.customer as string;
        const subscriptionId = checkoutSession.subscription as string;
        const firebaseUid = checkoutSession.metadata?.firebaseUid; // Retrieve firebaseUid from metadata

        if (firebaseUid) {
          await setDoc(doc(firestore, 'users', firebaseUid), {
            isPro: true,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            updatedAt: new Date(),
          }, { merge: true });
          console.log(`User ${firebaseUid} set to isPro: true after checkout.session.completed`);
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        const customerSubscriptionId = subscription.customer as string;

        // Find the user by stripeCustomerId
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('stripeCustomerId', '==', customerSubscriptionId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          const firebaseUidFromDb = userDoc.id;

          const newIsProStatus = subscription.status === 'active' || subscription.status === 'trialing';

          await setDoc(doc(firestore, 'users', firebaseUidFromDb), {
            isPro: newIsProStatus,
            stripeSubscriptionStatus: subscription.status,
            updatedAt: new Date(),
          }, { merge: true });
          console.log(`User ${firebaseUidFromDb} subscription status updated to ${newIsProStatus}`);
        }
        break;

      // Handle other events like invoice.payment_succeeded, invoice.payment_failed, etc.
      // For now, we focus on subscription status.
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing webhook event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}