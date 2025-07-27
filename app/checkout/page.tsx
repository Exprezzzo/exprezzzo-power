'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const priceId = searchParams.get('priceId');
  const plan = searchParams.get('plan') || 'monthly';

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      router.push('/dashboard?payment=success');
      return;
    }

    const cancelled = searchParams.get('canceled');
    if (cancelled === 'true') {
      setErrorMessage('Payment was cancelled. You can try again anytime.');
    }
  }, [searchParams, router]);

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const checkoutPriceId = priceId || 
        (plan === 'yearly' 
          ? process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID 
          : process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID);

      if (!checkoutPriceId) {
        throw new Error('No price ID available');
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: checkoutPriceId,
          userId: user?.uid,
          email: user?.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setErrorMessage(error.message || 'An error occurred during checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGuestCheckout = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const checkoutPriceId = priceId || process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: checkoutPriceId,
          isGuest: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Guest checkout error:', error);
      setErrorMessage(error.message || 'An error occurred during checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Complete Your Purchase
          </h2>
          <p className="mt-2 text-gray-600">
            {plan === 'yearly' ? 'Annual Plan - Save 20%' : 'Monthly Plan'}
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {errorMessage}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          {user ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Logged in as:</p>
                <p className="font-medium">{user.email}</p>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Proceed to Payment'}
              </button>

              <button
                onClick={() => router.push('/login')}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
              >
                Sign in with a different account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-gray-600">
                Sign in to save your subscription to your account
              </p>
              
              <button
                onClick={() => router.push(`/login?redirect=/checkout?plan=${plan}`)}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign In & Continue
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <button
                onClick={handleGuestCheckout}
                disabled={isProcessing}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Continue as Guest'}
              </button>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>Secure payment powered by Stripe</p>
          <p className="mt-1">
            By purchasing, you agree to our{' '}
            <a href="/terms" className="text-indigo-600 hover:text-indigo-500">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
