// app/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic'; // Import dynamic for client-side only component loading
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle } from 'lucide-react'; // Ensure AlertCircle is imported

// This component uses useSearchParams and should only render on the client
const SuccessContentComponent = () => {
  const router = useRouter();
  const searchParams = useRouter().query; // Access query from useRouter for client-side
  const sessionId = searchParams?.session_id as string | undefined; // Access session_id from query
  const { user, loading: authLoading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // We need to wait for authentication state to be known and user data to be loaded
    if (!authLoading) { // Only act once authentication state is known
      if (user) {
        if (user.isPro) {
          // User is Pro, redirect to playground
          setRedirecting(true);
          router.push('/playground');
        } else {
          // User is NOT Pro, but payment succeeded (assuming sessionId implies success).
          // This could be webhook delay. Implement a retry/polling mechanism or a clear message.
          console.log('Payment successful, but isPro is not yet true. Waiting for status update...');
          const checkProStatus = async () => {
            let attempts = 0;
            const maxAttempts = 10; // Increased attempts for more robustness
            const pollInterval = 3000; // Poll every 3 seconds

            while (attempts < maxAttempts && (!user || !user.isPro)) { // Check user.isPro in loop condition
              attempts++;
              console.log(`Attempt ${attempts} to verify pro status...`);
              // For useAuth with onSnapshot, the user object should update automatically here.
              await new Promise(resolve => setTimeout(resolve, pollInterval));
            }

            // Re-check user.isPro after polling loop
            if (user && user.isPro) {
              setRedirecting(true);
              router.push('/playground');
            } else {
              setErrorMessage(
                'Payment confirmed, but membership update is pending. Please wait a moment or try refreshing the page. If issue persists, contact support.'
              );
            }
          };

          if (sessionId) {
              checkProStatus();
          } else {
              setRedirecting(true);
              router.push('/pricing'); // Redirect to pricing if no session ID implies a non-payment path
          }
        }
      } else {
          // No user, redirect to login
          setRedirecting(true);
          router.push('/login');
      }
    }
  }, [authLoading, user, router, sessionId]);

  if (authLoading || redirecting || (user && !user.isPro && sessionId)) {
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

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-800">
      <div className="text-center">
        <p>An unexpected error occurred. Please try again or contact support.</p>
        <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Go Home</button>
      </div>
    </div>
  );
};

// Dynamically import the component that uses useSearchParams with ssr: false
export default function SuccessPage() {
  return <SuccessContentComponent />;
}