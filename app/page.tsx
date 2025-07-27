'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentButtonProps {
  productName?: string;
  priceId?: string;
  className?: string;
}

export function PaymentButton({ 
  productName = "Power Plan", 
  priceId,
  className = ""
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    setIsLoading(true);
    // Navigate to checkout with the priceId if provided
    if (priceId) {
      router.push(`/checkout?priceId=${priceId}`);
    } else {
      router.push('/checkout?plan=monthly');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-full shadow-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? 'Loading...' : `Upgrade to ${productName}`}
    </button>
  );
}
