// app/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth'; // Ensure useAuth provides real-time updates

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user, loading: authLoading } = useAuth(); // Get user and loading state from useAuth
  const [redirecting, setRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // We need to wait for authentication state to be known and user data to be loaded
    if (!authLoading && user) {
      if (user.isPro) {
        // User is Pro, redirect to playground
        setRedirecting(true);
        router.push('/playground');
      } else {
        // User is NOT Pro, but payment succeeded. This could be webhook delay.
        // Implement a retry/polling mechanism or a clear message.
        console.log('Payment successful, but isPro is not yet true. Waiting...');
        const checkProStatus = async () => {
          let attempts = 0;
          const maxAttempts = 5; // Try polling a few times
          const pollInterval = 2000; // Poll every 2 seconds

          while (attempts < maxAttempts && !user.isPro) {
            attempts++;
            console.log(`Attempt ${attempts} to verify pro status...`);
            // You might need to re-fetch user data here, or ensure useAuth automatically refreshes
            // For example, trigger a refresh: await user.reload(); // If Firebase auth object supports this
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }

          if (user.isPro) {
            setRedirecting(true);
            router.push('/playground');
          } else {
            setErrorMessage(
              'Payment confirmed, but membership update is pending. Please wait a moment or try refreshing the page. If issue persists, contact support.'
            );
            // Optionally redirect to a generic dashboard or home page after showing message
            // router.push('/dashboard'); // Example
          }
        };

        // Only start checking if the session_id is present and indicates a payment attempt
        if (sessionId) {
            // Optional: You can make an API call to your backend here to verify the session_id
            // await fetch('/api/verify-stripe-session', { method: 'POST', body: JSON.stringify({ sessionId }) });
            checkProStatus();
        } else {
            // If no session_id, maybe user navigated directly or cancelled.
            // Redirect to home or pricing if not already pro.
            setRedirecting(true);
            router.push('/'); // Or '/pricing'
        }
      }
    } else if (!authLoading && !user) {
        // No user, redirect to login
        setRedirecting(true);
        router.push('/login');
    }
  }, [authLoading, user, router, sessionId]); // Re-run effect when these dependencies change

  if (authLoading || redirecting) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-600 to-purple-800 text-white">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h1 className="text-2xl font-bold">Processing your payment and setting up your account...</h1>
          <p className="text-lg">Please do not close this page.</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-600 text-white">
        <div className="text-center p-8 rounded-lg shadow-xl">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Payment Processed, but Access Pending</h1>
          <p className="text-lg mb-6">{errorMessage}</p>
          <button
            onClick={() => router.push('/pricing')}
            className="px-6 py-3 bg-white text-red-700 rounded-md font-semibold hover:bg-gray-100 transition-colors"
          >
            Go to Pricing Page
          </button>
        </div>
      </div>
    );
  }

  // Fallback, ideally should always redirect or show an error
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-800">
      <div className="text-center">
        <p>An unexpected error occurred. Please try again or contact support.</p>
        <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Go Home</button>
      </div>
    </div>
  );
}