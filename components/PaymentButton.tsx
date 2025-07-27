// components/PaymentButton.tsx
'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export interface PaymentButtonProps {
  priceId: string;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
  userId?: string;
  userEmail?: string;
}

export function PaymentButton({
  priceId,
  buttonText = 'Get Started',
  className = '',
  disabled = false,
  userId,
  userEmail
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: userId || null,
          userEmail: userEmail || null
        })
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
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        bg-gradient-to-r from-blue-600 to-purple-600 
        hover:from-blue-700 hover:to-purple-700
        disabled:from-gray-600 disabled:to-gray-700
        disabled:cursor-not-allowed
        text-white font-semibold
        px-8 py-4 rounded-xl
        transition-all duration-200
        transform hover:scale-105 disabled:scale-100
        ${className}
      `}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </>
      ) : (
        buttonText
      )}
    </button>
  );
}

export default PaymentButton;
