// components/PaymentButton.tsx
// Assuming this is a client component as it uses useRouter and state if any.

'use client'; // Ensure this is present if it uses client-side hooks

import { useRouter } from 'next/navigation'; // Assuming Next.js App Router
import { loadStripe } from '@stripe/stripe-js'; // Make sure @stripe/stripe-js is installed: npm install @stripe/stripe-js

// Make sure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set in .env.local AND Vercel
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

interface PaymentButtonProps {
  priceId: string; // The Stripe Price ID for the $99/mo plan
  userId?: string; // Optional: User's ID from your auth system (e.g., Firebase UID)
  userEmail?: string; // Optional: User's email
  buttonText?: string;
}

export default function PaymentButton({ priceId, userId, userEmail, buttonText = "Get Power Access - $99/mo" }: PaymentButtonProps) {
  const router = useRouter(); // If you use useRouter for redirects

  const handleCheckout = async () => {
    try {
      const stripe = await stripePromise;

      if (!stripe) {
        console.error('Stripe.js failed to load.');
        return;
      }

      // Call your new Next.js API route
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          quantity: 1, // Or dynamically set quantity
          userId: userId,
          userEmail: userEmail,
          // successUrl: `${window.location.origin}/success`, // Can be sent from client or handled by API route env var
          // cancelUrl: `${window.location.origin}/cancel`,
        }),
      });

      const session = await response.json();

      if (response.ok && session.url) {
        // Redirect to Stripe Checkout hosted page
        router.push(session.url); // Use router.push for Next.js navigation
        // OR window.location.href = session.url;
      } else {
        console.error('Failed to create Stripe Checkout Session:', session.error);
        alert('Payment system temporarily unavailable. Please try again later.'); // User-friendly message
      }
    } catch (error) {
      console.error('Error during checkout process:', error);
      alert('An unexpected error occurred during payment. Please try again.');
    }
  };

  return (
    <button
      onClick={handleCheckout}
      // Add your button styling here, e.g., from your design brief:
      style={{
        width: '100%',
        padding: '16px',
        fontSize: '18px',
        background: '#22c55e', // Example green from your prompt
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