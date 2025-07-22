// components/PaymentButton.tsx
// Corrected to add a runtime check for the Stripe publishable key.

'use client';

import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import React from 'react';

// Get the publishable key from environment variables
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Conditionally load Stripe.js ONLY if the key is available
const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null; // Set to null if key is missing

interface PaymentButtonProps {
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

      const stripe = await stripePromise; // Await the promise only if it's not null

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