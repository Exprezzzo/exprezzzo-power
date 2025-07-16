'use client';
import { useState } from 'react';

const config = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
};

export function PaymentButton() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: 'price_1PgJHPGBnsaQSoj8jHiSdDhC', // Replace with your Price ID
          userId: 'user123',
          email: 'user@example.com'
        })
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      alert('Checkout error! Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCheckout} 
      disabled={loading}
      className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-black transition-all duration-200 bg-gradient-to-r from-green-400 to-green-600 rounded-lg hover:from-green-500 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
    >
      <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-gray-900"></span>
      <span className="absolute inset-0 w-full h-full rounded-lg shadow-lg bg-gradient-to-r from-green-400 to-green-600 animate-pulse"></span>
      <span className="relative flex items-center">
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <span className="mr-2">⚡</span>
            Get Power Access - $99/mo
            <span className="ml-2">→</span>
          </>
        )}
      </span>
    </button>
  );
}