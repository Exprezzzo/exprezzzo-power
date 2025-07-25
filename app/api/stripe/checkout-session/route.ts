// app/api/stripe/checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'; // For client-side Firestore
import { getAdminApp } from '@/lib/firebaseAdmin'; // For server-side Admin SDK
import { getAuth as getAdminAuth } from 'firebase-admin/auth'; // For server-side Firebase Admin Auth

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use a stable API version
});

export async function POST(req: NextRequest) {
  try {
    const { priceId, userId, userEmail } = await req.json(); // Expect userId and userEmail from frontend

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required.' }, { status: 400 });
    }

    if (!userId) {
      // This API route requires a userId to link payment to a user.
      // Ensure the frontend sends it or handle unauthenticated users differently.
      console.error('Checkout session creation failed: userId is missing.');
      return NextResponse.json({ error: 'Authentication required for checkout.' }, { status: 401 });
    }

    const adminApp = getAdminApp(); // Get the Firebase Admin app instance
    if (!adminApp) {
      throw new Error('Firebase Admin App not initialized.');
    }
    const adminFirestore = getFirestore(adminApp);

    // Retrieve or create Stripe Customer associated with Firebase UID
    const userRef = doc(adminFirestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    let customerId: string | undefined;

    if (userDoc.exists() && userDoc.data()?.stripeCustomerId) {
      customerId = userDoc.data().stripeCustomerId;
      console.log(`Using existing Stripe customer for user ${userId}: ${customerId}`);
    } else {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail || undefined, // Use email if provided
        metadata: { firebaseUid: userId }, // Link to Firebase UID for webhook
      });
      customerId = customer.id;
      // Save the new Stripe customer ID to Firestore
      await setDoc(userRef, { stripeCustomerId: customer.id }, { merge: true });
      console.log(`Created new Stripe customer for user ${userId}: ${customerId}`);
    }

    // Construct dynamic success and cancel URLs
    const host = req.headers.get('host'); // e.g., your-domain.vercel.app
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

    const successUrl = `${protocol}://${host}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${protocol}://${host}/pricing`;

    // Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId, // Use the retrieved or newly created customer ID
      mode: 'subscription',
      line_items: [
        {
          price: priceId, // The Stripe Price ID
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true, // Allow promo codes if desired
      // Pass metadata to the session for later retrieval in webhooks/success page
      metadata: {
        firebaseUid: userId,
      },
      // Prefill customer email if available
      customer_email: userEmail || undefined,
    });

    if (!session.url) {
      throw new Error('Stripe session URL not created.');
    }

    console.log(`Stripe Checkout Session created for user ${userId}: ${session.url}`);
    return NextResponse.json({ url: session.url }, { status: 200 });

  } catch (error: any) {
    console.error('Error in Stripe checkout-session API:', error);
    // Provide a more generic error to the client for security, but log details server-side
    return NextResponse.json(
      { error: 'Payment system temporarily unavailable. Please verify your Stripe API keys and Price IDs, and ensure you are logged in.' },
      { status: 500 }
    );
  }
}
