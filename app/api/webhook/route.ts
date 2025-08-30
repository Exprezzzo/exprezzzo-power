import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

export const runtime = 'nodejs';

if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
    : null;
    
  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    })
  : null;

export async function POST(req: NextRequest) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  
  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    const db = getFirestore();
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, plan } = session.metadata || {};
        
        if (userId) {
          await db.collection('users').doc(userId).set({
            isPro: plan === 'power' || plan === 'enterprise',
            plan: plan || 'community',
            subscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
            subscribedAt: new Date().toISOString(),
          }, { merge: true });
          
          console.log(`User ${userId} upgraded to ${plan}`);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        
        if (userId) {
          await db.collection('users').doc(userId).set({
            isPro: false,
            plan: 'community',
            subscriptionId: null,
            canceledAt: new Date().toISOString(),
          }, { merge: true });
          
          console.log(`User ${userId} subscription canceled`);
        }
        break;
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 });
  }
}