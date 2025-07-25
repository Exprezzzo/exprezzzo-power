// app/success/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import with no SSR for the component using searchParams
const SuccessContent = dynamic(
  () => Promise.resolve(SuccessContentComponent),
  { 
    ssr: false,
    loading: () => (
      <div style={{
        minHeight: '100vh', 
        background: 'radial-gradient(circle at top left, #1a1a2e, #0f0f1d, #000)',
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: '24px'
      }}>
        Loading payment details...
      </div>
    )
  }
);

function SuccessContentComponent() {
  const router = useRouter();
  const [message, setMessage] = useState('Verifying your payment...');
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Get session ID from URL on client side only
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('session_id');
      setSessionId(id);
      
      if (id) {
        setMessage('Payment successful! Thank you for your purchase.');
        console.log('Stripe Session ID:', id);
      } else {
        setMessage('Payment verification in progress or no session ID found. Please check your email.');
      }
    }
  }, []);

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
      {sessionId && (
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
          Session ID: {sessionId.substring(0, 8)}...
        </p>
      )}
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

export default function SuccessPage() {
  return <SuccessContent />;
}