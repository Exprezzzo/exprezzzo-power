// app/pricing/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Zap, ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth'; // Assuming useAuth is properly implemented

// Dynamically import PaymentButton as it's a client component
const PaymentButton = dynamic(
  () => import('@/components/PaymentButton'), // This now correctly imports the default export
  { ssr: false }
);

export default function PricingPage() {
  const { user } = useAuth(); // Access user info from useAuth
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // IMPORTANT: REPLACE these with your ACTUAL Stripe Price IDs!
  const PRICE_IDS = {
    monthly: 'price_YOUR_MONTHLY_ID', // <<-- Replace with your actual Monthly Price ID
    yearly: 'price_YOUR_YEARLY_ID' // <<-- Replace with your actual Yearly Price ID
  };

  const features = [
    'Access to GPT-4o, Claude Opus, Gemini Pro',
    'Unlimited API calls',
    'Priority support',
    'Custom model routing',
    'Usage analytics dashboard',
    'Team collaboration features'
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-white mb-8"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to home
          </Link>

          <h1 className="text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-400">
            One plan, all features. No hidden costs.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-900 p-1 rounded-lg">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Power User</h2>
            <div className="flex items-baseline justify-center">
              <span className="text-5xl font-bold">
                ${billingPeriod === 'monthly' ? '97' : '931'}
              </span>
              <span className="text-gray-400 ml-2">
                /{billingPeriod === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            {billingPeriod === 'yearly' && (
              <p className="text-green-400 mt-2">Save $233 per year!</p>
            )}
          </div>

          {/* Features */}
          <ul className="space-y-4 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <Check className="text-green-400 mr-3 mt-0.5 flex-shrink-0" size={20} />
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          {user?.isPro ? (
            <button
              disabled
              className="w-full bg-gray-700 text-gray-400 py-4 rounded-lg font-semibold cursor-not-allowed"
            >
              You're already a Power User! 🎉
            </button>
          ) : (
            <PaymentButton
              priceId={PRICE_IDS[billingPeriod]}
              buttonText={`Start your ${billingPeriod} plan`}
              userId={user?.uid} // Pass userId
              userEmail={user?.email} // Pass userEmail
            />
          )}
        </div>

        {/* FAQ or additional info */}
        <div className="mt-16 text-center text-gray-400">
          <p className="mb-4">
            Questions? Check our <Link href="/faq" className="text-blue-400 hover:underline">FAQ</Link> or{' '}
            <Link href="/contact" className="text-blue-400 hover:underline">contact support</Link>
          </p>
          <p className="text-sm">
            Cancel anytime. No questions asked. 30-day money-back guarantee.
          </p>
        </div>
      </div>
    </div>
  );
}
