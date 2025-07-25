// app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth'; // Assuming useAuth is properly implemented
import Link from 'next/link';
import { ArrowLeft, CreditCard, Shield, Check, Mail, Lock, AlertCircle } from 'lucide-react'; // Ensure all icons are imported
import dynamic from 'next/dynamic';

// Dynamically import PaymentButton
const PaymentButton = dynamic(
  () => import('@/components/PaymentButton').then(mod => mod.PaymentButton),
  { ssr: false }
);

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Correct way to use search params in client components
  const { user, signIn, signUp } = useAuth(); // Assuming useAuth provides signIn and signUp

  const plan = searchParams.get('plan') || 'power';
  const period = searchParams.get('period') || 'monthly';

  const [email, setEmail] = useState(user?.email || ''); // Pre-fill email if user is logged in
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const priceInfo = {
    monthly: { price: 97, interval: 'month' },
    yearly: { price: 931, interval: 'year', savings: 233 }
  };

  // IMPORTANT: These are your ACTUAL Stripe Price IDs from your dashboard!
  const PRICE_IDS = {
    monthly: 'price_1Ron5iHMIqbrm277EwcrZ1QD', // Your provided Monthly Price ID
    yearly: 'price_1Ron8kHMIqbrm2776x3uVAH5' // Your provided Yearly Price ID
  };

  const handleCreateAccountAndProceed = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setError('');
    setLoading(true);

    try {
      // If user is not logged in, attempt to sign up with provided email/password
      if (!user) {
        if (!email) {
          throw new Error('Email is required to create an account or proceed as guest.');
        }
        if (password) { // If password is provided, attempt to sign up
          await signUp(email, password);
          // User is now authenticated by Firebase
        } else {
          // If no password, allow "guest" checkout by just continuing
          // The PaymentButton will pass the email.
        }
      }
      // Now proceed to payment with potentially newly authenticated user or existing user
      await handleProceedToStripe();

    } catch (err: any) {
      console.error("Authentication during checkout error:", err);
      setError(err.message || "Failed to create account or sign in. Please try logging in first.");
      setLoading(false);
    }
  };


  const handleProceedToStripe = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: PRICE_IDS[period as keyof typeof PRICE_IDS],
          userId: user?.uid || null, // Pass uid if authenticated
          userEmail: user?.email || email, // Pass authenticated email or entered guest email
        }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url; // Redirect to Stripe
      } else {
        throw new Error('Failed to create checkout session. No URL received.');
      }
    } catch (err: any) {
      console.error('Stripe checkout session error:', err);
      setError(err.message || 'Payment system temporarily unavailable. Please verify your Stripe API keys.');
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Complete Your Purchase</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span>Exprezzzo Power User</span>
                <span className="font-bold">
                  ${priceInfo[period as keyof typeof priceInfo].price}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Billing period</span>
                <span>{period === 'monthly' ? 'Monthly' : 'Yearly'}</span>
              </div>
              {period === 'yearly' && (
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
                  <p className="text-green-400 text-sm">
                    You're saving ${priceInfo.yearly.savings} per year!
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-800 pt-6">
              <h3 className="font-semibold mb-4">Included in your plan:</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Unlimited API calls to all AI models</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Priority support & 99.9% uptime SLA</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Advanced analytics & team features</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Payment Form / Account Creation */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
            {!user ? (
              <>
                <h2 className="text-2xl font-bold mb-6">Create Your Account</h2>
                <p className="text-gray-400 mb-6">
                  You can complete your purchase as a guest (no password) or create an account for easy access.
                </p>

                <form onSubmit={handleCreateAccountAndProceed} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Password (optional)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                        placeholder="Create a password or leave blank for guest checkout"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Leaving password blank means you'll checkout as a guest. You can create a password later.
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit" // Changed to submit to trigger handleCreateAccountAndProceed
                    disabled={loading || !email}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      'Processing...'
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        {password ? 'Create Account & Pay' : 'Proceed as Guest & Pay'}
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : ( // If user is already logged in
              <>
                <div className="mb-6 bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                  <p className="text-blue-400">
                    Purchasing as: <strong>{user.email}</strong>
                  </p>
                </div>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2 mb-6">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
                <button
                  onClick={handleProceedToStripe} // Direct call if already logged in
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Proceed to Payment
                    </>
                  )}
                </button>
              </>
            )}


            <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Secure checkout powered by Stripe</span>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              By purchasing, you agree to our{' '}
              <Link href="/terms" className="text-blue-400 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-blue-400 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
