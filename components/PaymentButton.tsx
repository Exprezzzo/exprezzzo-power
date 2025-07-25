// components/PaymentButton.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentButtonProps {
  priceId: string; // The Stripe Price ID for the product
  children: React.ReactNode; // Content inside the button (e.g., "Purchase")
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({ priceId, children }) => {
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
        body: JSON.stringify({ priceId }),
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
      setError(`Payment system temporarily unavailable: ${err.message}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
      >
        {loading ? 'Processing...' : children}
      </button>
      {error && (
        <p className="mt-2 text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
};