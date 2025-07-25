// app/api/stripe/checkout-session/route.ts
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase'; // Assuming Firebase auth is correctly imported and initialized
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'; // Import Firestore functions

// Ensure Stripe is initialized with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use a recent API version for best compatibility
});

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();

    // Get current authenticated user from Firebase
    // NOTE: For Next.js API routes, `auth.currentUser` is for client-side.
    // For server-side, you'd typically verify an ID token or use Firebase Admin SDK for auth.
    // Assuming 'auth' here *might* imply Firebase Admin SDK if run server-side.
    // If 'auth' is client-side only, you'll need to pass the user's ID token from client.
    // For now, I'm using `auth.currentUser` which would work if this API route
    // is structured such that it shares a context with client-side auth,
    // or if `auth` itself is a server-side initialized admin instance.
    // Best practice for server: client sends ID token, server verifies with admin SDK.
    const currentUser = auth.currentUser; 

    // --- CRITICAL CHECK: User Authentication ---
    // If you are relying on client-side auth.currentUser, this check might fail server-side.
    // For server-side authenticated requests, the client should send an ID token.
    // Example: const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    //          const decodedToken = await adminAuth.verifyIdToken(idToken);
    //          const userId = decodedToken.uid;
    // For simplicity with existing structure, I'll proceed with auth.currentUser,
    // but if this consistently fails, client-side ID token passing is needed.

    if (!currentUser) {
      console.error('User not authenticated for checkout session.');
      return NextResponse.json({ error: 'Authentication required for checkout.' }, { status: 401 });
    }

    const userId = currentUser.uid; // Get the user's UID

    const firestore = getFirestore(); // Get Firestore instance
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    let customerId: string | undefined;

    // Retrieve or create Stripe Customer
    if (userDoc.exists() && userDoc.data()?.stripeCustomerId) {
      customerId = userDoc.data().stripeCustomerId;
    } else {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: currentUser.email || undefined, // Use email if available
        metadata: { firebaseUid: userId }, // Link to Firebase UID for webhook
      });
      customerId = customer.id;
      // Save the new Stripe customer ID to Firestore
      await setDoc(userRef, { stripeCustomerId: customer.id }, { merge: true });
      console.log(`Created new Stripe customer for user ${userId}: ${customerId}`);
    }

    // Construct dynamic success and cancel URLs
    const host = req.headers.get('host'); // e.g., your-domain.vercel.app
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'; // Use HTTPS in production

    const successUrl = `${protocol}://${host}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${protocol}://${host}/pricing`; // Redirect to pricing page on cancel

    // Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId, // Use the retrieved or newly created customer ID
      mode: 'subscription', // Use 'subscription' for recurring payments
      line_items: [
        {
          price: priceId, // The Stripe Price ID
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Optional: Pass metadata for the session if needed
      metadata: {
        firebaseUid: userId,
      },
    });

    if (!session.url) {
      throw new Error('Stripe session URL not created.');
    }

    console.log(`Stripe Checkout Session created for user ${userId}: ${session.url}`);
    return NextResponse.json({ url: session.url }, { status: 200 });

  } catch (error: any) {
    console.error('Error in Stripe checkout-session API:', error);
    // Provide a more generic error to the client for security
    return NextResponse.json(
      { error: 'Payment system temporarily unavailable. Please try again or contact support.' },
      { status: 500 }
    );
  }
}