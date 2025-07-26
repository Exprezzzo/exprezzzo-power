// app/checkout/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import PaymentButton from '@/components/PaymentButton';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const priceId = searchParams.get('priceId');
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user?.uid,
          userEmail: user?.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error instanceof Error ? error.message : 'Something went wrong');
      setLoading(false);
    }
  };

  if (!priceId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No plan selected</h1>
          <Link href="/pricing" className="text-blue-400 hover:underline">
            Return to pricing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Complete Your Purchase</h1>
        
        {!user && (
          <div className="mb-6 p-4 bg-blue-900/50 rounded-lg">
            <p className="text-blue-300 text-sm">
              You're checking out as a guest. You'll create an account after payment.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <PaymentButton
            priceId={priceId}
            onClick={handleCheckout}
            loading={loading}
          />
          
          <Link 
            href="/pricing" 
            className="block text-center text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
