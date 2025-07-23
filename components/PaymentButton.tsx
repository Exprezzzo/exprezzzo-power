// components/PaymentButton.tsx
// Updated with the correct Stripe Price ID for Test Mode.

'use client';

import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import React from 'react';

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

interface PaymentButtonProps {
  // The priceId prop will now be passed dynamically from HomePage,
  // but we ensure it's used correctly here.
  priceId: string;
  userId?: string;
  userEmail?: string;
  buttonText?: string;
}

export default function PaymentButton({ priceId, userId, userEmail, buttonText = "Get Power Access — $99/mo" }: PaymentButtonProps) {
  const router = useRouter();

  const handleCheckout = async () => {
    try {
      if (!STRIPE_PUBLISHABLE_KEY) {
        console.error('Stripe Publishable Key is missing from environment variables.');
        alert('Payment system configuration error. Please contact support.');
        return;
      }

      const stripe = await stripePromise;

      if (!stripe) {
        console.error('Stripe.js failed to load, even with a key. Check console for details.');
        alert('Payment system is not available. Please try again later.');
        return;
      }

      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Use the dynamic priceId passed to the component
          priceId: priceId,
          quantity: 1,
          userId: userId || 'anonymous',
          userEmail: userEmail || 'anonymous@example.com',
        }),
      });

      const session = await response.json();

      if (response.ok && session.url) {
        router.push(session.url);
      } else {
        console.error('Failed to create Stripe Checkout Session:', session.error || session.details);
        alert('Payment system temporarily unavailable. Please check console for details.');
      }
    } catch (error) {
      console.error('An unexpected error occurred during checkout:', error);
      alert('An unexpected error occurred during payment. Please try again.');
    }
  };

  return (
    <button
      onClick={handleCheckout}
      style={{
        width: '100%',
        padding: '16px',
        fontSize: '18px',
        background: '#22c55e',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      {buttonText}
    </button>
  );
}