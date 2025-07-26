// app/checkout/page.tsx
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { PaymentButton } from '@/components/PaymentButton';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const priceId = searchParams.get('priceId');
  const { user } = useAuth();

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

        <div className="space-y-4">
          <PaymentButton priceId={priceId} />
          
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
