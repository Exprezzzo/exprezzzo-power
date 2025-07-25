// app/page.tsx
'use client'; // Ensure this is a client component

import Link from 'next/link';
import Image from 'next/image'; // If you use an Image component
import dynamic from 'next/dynamic';
import { ArrowRight, Zap, Brain, Sparkles, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth to check user status

// Dynamically import PaymentButton to ensure it's client-side rendered
const PaymentButton = dynamic(
  () => import('@/components/PaymentButton').then(mod => mod.PaymentButton), // Correctly imports named export
  { ssr: false }
);

export default function LandingPage() {
  const { user, loading } = useAuth(); // Get user and loading state from useAuth
  const isUserAuthenticated = !!user; // True if user object exists

  // ACTUAL Stripe Test Price ID for your Monthly Plan
  const FOUNDING_PRICE_ID = 'price_1Ron5iHMIqbrm277EwcrZ1QD'; // <<-- This is your Monthly Plan Price ID

  // Display loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <Link href="/" className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors">
          Exprezzzo Power
        </Link>
        <nav className="space-x-4">
          {!isUserAuthenticated ? (
            <>
              <Link href="/login" className="text-blue-300 hover:text-blue-200 transition-colors">
                Login
              </Link>
              <Link href="/signup" className="text-blue-300 hover:text-blue-200 transition-colors">
                Sign Up
              </Link>
            </>
          ) : (
            <Link href="/playground" className="text-blue-300 hover:text-blue-200 transition-colors">
              Go to Playground
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl z-0">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 animate-fade-in-up">
          Unlock the <span className="text-blue-400">Power of AI</span>. Simplified.
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl animate-fade-in-up delay-200">
          One API, all AI. Get lightning-fast, affordable access to top AI models like
          GPT-4o, Llama 3, Gemini, and Claude Opus.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mb-12 animate-fade-in-up delay-400">
          <Link href="/pricing" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center justify-center group">
            Explore Pricing
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/dashboard" className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center justify-center group">
            Developer API
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Direct Purchase Section */}
        <div className="max-w-md mx-auto bg-gray-900 rounded-xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-400 mb-6">Purchase a Power Plan instantly and gain full access.</p>

          {/* Conditionally render PaymentButton or login/signup prompt */}
          {isUserAuthenticated ? (
            <PaymentButton // Use PaymentButton directly here now as it's client-side due to dynamic import above
              priceId={FOUNDING_PRICE_ID}
              buttonText="Get Power Access Now — $97/mo"
              userId={user?.uid} // Pass userId from useAuth
              userEmail={user?.email} // Pass userEmail from useAuth
            />
          ) : (
            // If not authenticated, prompt to login/signup first
            <div className="flex flex-col gap-3">
              <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg text-center">
                Login to Purchase
              </Link>
              <Link href="/signup" className="text-blue-400 hover:text-blue-300 text-sm text-center">
                Don't have an account? Sign up
              </Link>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-4">
            Secure checkout powered by Stripe
          </p>
        </div>
      </main>

      <footer className="mt-12 text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Exprezzzo Power. All rights reserved.
      </footer>
    </div>
  );
}
