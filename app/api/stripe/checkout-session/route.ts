// app/api/stripe/checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminApp, getAdminFirestore } from '@/lib/firebaseAdmin';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use a stable API version
});

export async function POST(req: NextRequest) {
  // Add environment variable debug logging (as per Deep Intelligence Report)
  console.log('--- Checkout Session ENV Check ---');
  console.log('STRIPE_SECRET_KEY LOADED:', !!process.env.STRIPE_SECRET_KEY);
  console.log('FIREBASE_PRIVATE_KEY LOADED:', !!process.env.FIREBASE_PRIVATE_KEY);
  console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
  console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
  console.log('--- End ENV Check ---');

  try {
    const { priceId, userId, userEmail } = await req.json();

    if (!priceId) {
      console.error('Checkout session: Price ID is missing.');
      return NextResponse.json({ error: 'Price ID is required.' }, { status: 400 });
    }

    const adminApp = getAdminApp();
    const adminFirestore = getAdminFirestore();

    if (!adminApp || !adminFirestore) {
      console.error("Checkout-session API: Firebase Admin SDK not fully initialized. Cannot process.");
      return NextResponse.json({ error: "Server configuration error. Please try again later." }, { status: 500 });
    }

    let customerId: string | undefined;

    if (userId) {
      const userRef = adminFirestore.collection('users').doc(userId);
      const userDoc = await userRef.get();

      const userData = userDoc.data();
      if (userDoc.exists && userData && typeof userData.stripeCustomerId === 'string') {
        customerId = userData.stripeCustomerId;
        console.log(`Using existing Stripe customer for user ${userId}: ${customerId}`);
      } else {
        const customer = await stripe.customers.create({
          email: userEmail || undefined,
          metadata: { firebaseUid: userId },
        });
        customerId = customer.id;
        await userRef.set({ stripeCustomerId: customer.id }, { merge: true });
        console.log(`Created new Stripe customer for user ${userId}: ${customerId}`);
      }
    } else if (userEmail) {
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

    const host = req.headers.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

    const successUrl = `${protocol}://${host}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${protocol}://${host}/pricing`;

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

// Handle CORS preflight (as per your Deep Intelligence Report)
export async function OPTIONS() { // Removed the unused 'req: NextRequest' parameter
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Adjust as per your CORS policy for frontend
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Include Authorization if you use it for API routes
    },
  });
}