// app/invite/page.tsx
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, Gift } from 'lucide-react';

// This component directly uses useSearchParams, so it should be wrapped in Suspense
function InviteContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <Gift className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-5xl font-bold mb-4">
            You're Invited! 🎉
          </h1>
          <p className="text-xl text-gray-300">
            Your friend thinks you'll love Exprezzzo Power
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl p-8 mb-8 border border-purple-500/50">
          <h2 className="text-2xl font-bold mb-4">
            Special Offer: Get 20% Off Your First Month
          </h2>
          <p className="text-gray-300 mb-6">
            Join thousands of developers using our unified AI API to save time and money.
          </p>

          <Link
            href={`/signup?ref=${ref}`} // Pass referral code to signup page
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
          >
            <Sparkles className="w-5 h-5" />
            Claim Your Discount
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <div className="text-3xl font-bold text-blue-400 mb-2">$97/mo</div>
            <div className="text-gray-400">Unlimited AI Access</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <div className="text-3xl font-bold text-green-400 mb-2">40%</div>
            <div className="text-gray-400">Cost Savings</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <div className="text-3xl font-bold text-purple-400 mb-2">24/7</div>
            <div className="text-gray-400">Priority Support</div>
          </div>
        </div>

        <p className="text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

// Wrap the content that uses useSearchParams in Suspense
export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading invite...</div>}>
      <InviteContent />
    </Suspense>
  );
}
