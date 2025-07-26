// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminApp, getAdminFirestore } from '@/lib/firebaseAdmin';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

// Phoenix v3.4: Explicitly set runtime for Node.js environment
export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const adminApp = getAdminApp();
    const adminFirestore = getAdminFirestore();
    const adminAuth = getAdminAuth(adminApp);

    if (!adminApp || !adminFirestore || !adminAuth) {
      console.error("Webhook: Firebase Admin SDK not fully initialized");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const customerId = session.customer as string;
          const customer = await stripe.customers.retrieve(customerId);
          
          let firebaseUid = session.metadata?.firebaseUid;
          
          if (!firebaseUid || firebaseUid === 'guest') {
            const customerEmail = (customer as Stripe.Customer).email;
            
            if (customerEmail) {
              try {
                const userRecord = await adminAuth.createUser({
                  email: customerEmail,
                  emailVerified: false,
                });
                firebaseUid = userRecord.uid;
                console.log(`Created new Firebase user for email ${customerEmail}: ${firebaseUid}`);
              } catch (error: any) {
                if (error.code === 'auth/email-already-exists') {
                  const existingUser = await adminAuth.getUserByEmail(customerEmail);
                  firebaseUid = existingUser.uid;
                  console.log(`Found existing Firebase user for email ${customerEmail}: ${firebaseUid}`);
                } else {
                  console.error('Error creating Firebase user:', error);
                  return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
                }
              }
            } else {
              console.error('No email found for guest checkout');
              return NextResponse.json({ error: 'Email required for account creation' }, { status: 400 });
            }
          }

          const subscriptionData = {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: new Date(),
          };

          await adminFirestore
            .collection('users')
            .doc(firebaseUid)
            .set(subscriptionData, { merge: true });

          await stripe.customers.update(customerId, {
            metadata: { firebaseUid },
          });

          console.log(`Updated user ${firebaseUid} with subscription ${subscription.id}`);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        const usersSnapshot = await adminFirestore
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          const updateData: any = {
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: new Date(),
          };

          if (subscription.status === 'active') {
            updateData.stripeCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);
          }

          await userDoc.ref.update(updateData);
          console.log(`Updated subscription status for user ${userDoc.id}: ${subscription.status}`);
        } else {
          console.error(`No user found for Stripe customer ${customerId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = invoice.subscription as string;
        const customerId = invoice.customer as string;

        const usersSnapshot = await adminFirestore
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          
          if (subscription) {
            const subscriptionData = await stripe.subscriptions.retrieve(subscription);
            await userDoc.ref.update({
              stripeCurrentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
              status: 'active',
              updatedAt: new Date(),
            });
            console.log(`Extended subscription period for user ${userDoc.id}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const usersSnapshot = await adminFirestore
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          await userDoc.ref.update({
            status: 'past_due',
            updatedAt: new Date(),
          });
          console.log(`Marked subscription as past_due for user ${userDoc.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
