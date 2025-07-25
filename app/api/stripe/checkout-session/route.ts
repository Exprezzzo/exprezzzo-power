// app/api/stripe/checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminApp, getAdminFirestore } from '@/lib/firebaseAdmin';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use a stable API version
});

export async function POST(req: NextRequest) {
  try {
    const { priceId, userId, userEmail } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required.' }, { status: 400 });
    }

    const adminApp = getAdminApp(); // Get the Firebase Admin app instance
    const adminFirestore = getAdminFirestore(); // Use the safe getter for Firestore

    if (!adminApp || !adminFirestore) { // Check both app and firestore are valid
      console.error("Checkout-session API: Firebase Admin SDK not fully initialized. Cannot process.");
      return NextResponse.json({ error: "Server configuration error. Please try again later." }, { status: 500 });
    }

    let customerId: string | undefined;

    // If a userId is passed from an authenticated user, try to find/create their Stripe customer
    if (userId) {
      const userRef = adminFirestore.collection('users').doc(userId); // Use adminFirestore here
      const userDoc = await userRef.get();
      const userData = userDoc.data(); // Store the data once

      if (userDoc.exists && userData?.stripeCustomerId) {
        customerId = userData.stripeCustomerId; // Now we can safely access it
        console.log(`Using existing Stripe customer for user ${userId}: ${customerId}`);
      } else {
        // Create a new Stripe customer
        const customer = await stripe.customers.create({
          email: userEmail || undefined,
          metadata: { firebaseUid: userId },
        });
        customerId = customer.id;
        await userRef.set({ stripeCustomerId: customer.id }, { merge: true }); // Use userRef.set directly from adminFirestore
        console.log(`Created new Stripe customer for user ${userId}: ${customerId}`);
      }
    } else if (userEmail) {
      // If no userId but email is provided (guest checkout), try to find existing customer by email
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log(`Using existing Stripe customer found by email for guest: ${customerId}`);
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { guestEmail: userEmail }
        });
        customerId = customer.id;
        console.log(`Created new Stripe customer for guest email: ${customerId}`);
      }
    } else {
        console.error('Checkout session creation failed: no userId or userEmail provided.');
        return NextResponse.json({ error: 'User information missing for checkout.' }, { status: 400 });
    }


    // Construct dynamic success and cancel URLs
    const host = req.headers.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

    const successUrl = `${protocol}://${host}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${protocol}://${host}/pricing`;

    // Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: { firebaseUid: userId || 'guest' },
      customer_email: userEmail || undefined,
    });

    if (!session.url) {
      throw new Error('Stripe session URL not created.');
    }

    console.log(`Stripe Checkout Session created for user ${userId || 'guest'}: ${session.url}`);
    return NextResponse.json({ url: session.url }, { status: 200 });

  } catch (error: any) {
    console.error('Error in Stripe checkout-session API:', error);
    return NextResponse.json(
      { error: 'Payment system temporarily unavailable. Please verify your Stripe API keys and Price IDs, and ensure you are logged in.' },
      { status: 500 }
    );
  }
}
