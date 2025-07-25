// app/api/stripe/checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'; // For client-side Firestore
import { getAdminApp } from '@/lib/firebaseAdmin'; // For server-side Admin SDK
// Removed: import { getAuth as getAdminAuth } from 'firebase-admin/auth'; // Not used in this file

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

    const adminApp = getAdminApp(); // Get the Firebase Admin app instance
    if (!adminApp) {
      console.error("Checkout-session API: Firebase Admin App not initialized. Cannot create Stripe customer.");
      return NextResponse.json({ error: "Server configuration error. Please try again later." }, { status: 500 });
    }
    const adminFirestore = getFirestore(adminApp);

    let customerId: string | undefined;

    // If a userId is passed from an authenticated user, try to find/create their Stripe customer
    if (userId) {
      const userRef = doc(adminFirestore, 'users', userId);
      const userDoc = await getDoc(userRef);

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
    } else if (userEmail) {
      // If no userId but email is provided (guest checkout), try to find existing customer by email
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log(`Using existing Stripe customer found by email for guest: ${customerId}`);
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { guestEmail: userEmail } // Mark as guest for webhook
        });
        customerId = customer.id;
        console.log(`Created new Stripe customer for guest email: ${customerId}`);
      }
    } else {
        console.error('Checkout session creation failed: no userId or userEmail provided.');
        return NextResponse.json({ error: 'User information missing for checkout.' }, { status: 400 });
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
        firebaseUid: userId || 'guest', // Pass 'guest' if not authenticated Firebase user
        planType: plan, // Pass plan type from query param if available (though not used in client request)
      },
      // Prefill customer email if available
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
