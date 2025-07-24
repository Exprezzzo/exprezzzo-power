// app/success/page.tsx

'use client'; // This is a client component

import React, { useEffect, useState, Suspense } from 'react'; // Ensure Suspense is imported
import { useRouter, useSearchParams } from 'next/navigation';

// This component will use the search params and display the actual success content
function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // This hook requires Suspense
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (sessionId) {
      setMessage('Payment successful! Thank you for your purchase.');
      console.log('Stripe Session ID:', sessionId);
      // In a real app, you might:
      // 1. Make an API call here to your own backend to verify this session server-side
      //    (This provides an extra layer of security and updates your DB if webhook fails)
      // 2. Redirect to a user dashboard after a short delay: setTimeout(() => router.push('/dashboard'), 3000);
    } else {
      setMessage('Payment verification in progress or no session ID found. Please check your email.');
      // If no session ID, it might be a direct visit or an issue.
      // Consider redirecting to homepage or a generic error page.
      // router.push('/');
    }
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, #1a1a2e, #0f0f1d, #000)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '20px', color: '#22c55e' }}>
        🎉 Payment Success!
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#aaa', maxWidth: '600px', marginBottom: '40px' }}>
        {message}
      </p>
      <button
        onClick={() => router.push('/')}
        style={{
          padding: '12px 24px',
          fontSize: '1rem',
          background: '#3577ae',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Go to Homepage
      </button>
    </div>
  );
}

// The main page component that wraps the content needing searchParams in Suspense
export default function SuccessPageWrapper() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', background: 'radial-gradient(circle at top left, #1a1a2e, #0f0f1d, #000)',
        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
      }}>
        Loading payment details...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}