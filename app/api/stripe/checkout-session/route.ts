// app/api/stripe/checkout-session/route.ts
// Ensure you have `stripe` imported and initialized from 'stripe'.
// Also, `NextRequest` and `NextResponse` from 'next/server'.

import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase'; // Assuming Firebase auth is initialized
import { collection, getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'; // Import Firestore functions

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use a recent API version
});

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();
    const user = auth.currentUser; // Get current authenticated user

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const firestore = getFirestore();
    const userRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    let customerId: string | undefined;

    if (userDoc.exists() && userDoc.data()?.stripeCustomerId) {
      customerId = userDoc.data().stripeCustomerId;
    } else {
      // Create a new Stripe customer if one doesn't exist for the user
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { firebaseUid: user.uid },
      });
      customerId = customer.id;
      // Save the new Stripe customer ID to Firestore
      await setDoc(userRef, { stripeCustomerId: customer.id }, { merge: true });
    }

    const host = req.headers.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'; // Use https in production

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${protocol}://${host}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${protocol}://${host}/pricing`, // Or your relevant pricing page
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}