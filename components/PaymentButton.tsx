"use client";
import { useState } from "react";

// Temporary config inline until paths are fixed
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: "price_exprezzzo_pro",
          userId: "user123",
          email: "user@example.com"
        })
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      alert("Checkout error!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCheckout} 
      disabled={loading} 
      className="bg-gradient-to-r from-green-400 to-green-600 text-black font-bold py-4 px-8 rounded-lg hover:from-green-500 hover:to-green-700 transition-all disabled:opacity-50"
    >
      {loading ? "Loading..." : "Get Power Access - $99/mo"}
    </button>
  );
}
