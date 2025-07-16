"use client";
import { useState } from "react";

// Use your API URL and Stripe key from your env or config setup
const config = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"
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
          priceId: "price_1RlY1vQaL51Vh0K7ww6S0XWY", // <--- your real Stripe price ID
          userId: "user123", // Replace with actual logged-in user
          email: "user@example.com" // Replace with actual user email
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
