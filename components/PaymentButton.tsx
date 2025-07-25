// components/PaymentButton.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentButtonProps {
  priceId: string; // The Stripe Price ID for the product
  buttonText: string; // Text to display on the button
  userId?: string; // Optional: Pass Firebase User ID for customer linking
  userEmail?: string | null; // Optional: Pass user email for customer linking
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({ priceId, buttonText, userId, userEmail }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call your Next.js API route to create a Stripe checkout session
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, userId, userEmail }), // Pass userId and userEmail
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session.');
      }

      const { url } = await response.json();
      if (url) {
        // Redirect to Stripe Checkout page
        window.location.assign(url);
      } else {
        throw new Error('No checkout URL received from API.');
      }
    } catch (err: any) {
      console.error('Stripe checkout error:', err);
      setError(`Payment system temporarily unavailable: ${err.message}. Please verify your Stripe API keys and Price IDs, and ensure you are logged in.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="px-8 py-4 rounded-lg font-semibold text-lg transition-all bg-blue-600 hover:bg-blue-700 text-white" // Combined with provided styling
      >
        {loading ? 'Processing...' : buttonText}
      </button>
      {error && (
        <p className="mt-2 text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
};

// This is now a named export to match app/page.tsx and app/pricing/page.tsx dynamic imports
