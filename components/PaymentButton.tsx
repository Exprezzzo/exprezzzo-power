'use client';
import { useState } from 'react';

interface PaymentButtonProps {
  priceId: string;
  buttonText?: string;
  productName?: string;
  userId?: string;
  userEmail?: string;
}

export function PaymentButton({ 
  priceId, 
  buttonText = "Get Started",
  productName 
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    // For now, just redirect to pricing
    window.location.href = '/pricing';
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
    >
      {loading ? 'Loading...' : buttonText}
    </button>
  );
}
