'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation'; // REMOVED useSearchParams - not being used
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Use a client component wrapper for useSearchParams
function CheckoutContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.uid,
          email: user?.email 
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Purchase
          </h2>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          {user ? (
            <div className="space-y-4">
              <p className="text-gray-600">Logged in as: {user.email}</p>
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">Please sign in to continue</p>
              <Link
                href="/login?redirect=/checkout"
                className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <CheckoutContent />;
}
