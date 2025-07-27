'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation'; // <<< CRITICAL FIX: 'useSearchParams' REMOVED from this line
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Use a client component wrapper for useSearchParams
function CheckoutContent() {
  const router = useRouter();
  // Ensure THIS LINE is ABSENT, if it was manually added back or uncommented:
  // const searchParams = useSearchParams();
  const { user, loading } = useAuth(); // Assuming useAuth provides user and loading
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // In a real application, you'd fetch checkout session details
  // based on searchParams.get('session_id') or similar,
  // and handle success/cancel logic here.
  // For now, we'll simulate a simple page.

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  if (!user) {
    router.push('/login'); // Redirect to login if not authenticated
    return null;
  }

  const handleCheckout = async () => {
    setErrorMessage(null);
    try {
      // In a real app, this would trigger your Stripe checkout session API route
      // For demonstration:
      console.log('Initiating checkout for user:', user.email);
      router.push('/success'); // Simulate success
    } catch (error: any) {
      console.error('Checkout error:', error);
      setErrorMessage(error.message || 'An unknown error occurred during checkout.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-6">Secure Checkout</h1>
      {user && <p className="text-lg mb-4">You are logged in as: {user.email}</p>}

      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center">Subscription Plan</h2>
        <div className="mb-4">
          <p className="text-gray-300">Plan: **Power ($97/month)**</p>
          <p className="text-gray-300">Description: Unlimited chats, advanced models, API access.</p>
        </div>

        {errorMessage && (
          <div className="bg-red-900 text-white p-3 rounded mb-4 text-center">
            Error: {errorMessage}
          </div>
        )}

        <button
          onClick={handleCheckout}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
        >
          Proceed to Payment
        </button>
        <p className="text-center text-gray-400 text-sm mt-4">
          Powered by Stripe. Your payment information is secure.
        </p>
      </div>

      <Link href="/pricing" className="mt-8 text-blue-400 hover:underline">
        Choose a different plan
      </Link>
    </div>
  );
}

// Wrap the CheckoutContent with Suspense for useSearchParams.
// This Suspense boundary is still correct and needed here for Next.js routing,
// even if useSearchParams is not directly destructured inside CheckoutContent.
export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading checkout page...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
