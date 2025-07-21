// app/invite/page.tsx
// Corrected to wrap useSearchParams() with Suspense for proper Next.js prerendering.

'use client'; // This directive must remain at the top

import { Suspense, useEffect, useState } from 'react'; // Ensure Suspense is imported
import { useRouter, useSearchParams } from 'next/navigation'; // Ensure useSearchParams is imported

// This component will use the search params
function InviteContent() {
  const searchParams = useSearchParams();
  // Ensure you handle potential null or undefined for 'code'
  const code = searchParams ? searchParams.get('code') : null;

  // --- Add your existing logic for the Invite page here ---
  // This is a placeholder for the actual content of your invite page.
  // Example: If your original page had more logic or a form, place it within this function.

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#1a1a1a',
        padding: '40px',
        borderRadius: '16px',
        border: '1px solid #333',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          ⚡ Invite to Exprezzzo Power Grid
        </h1>
        {code ? (
          <p style={{ textAlign: 'center' }}>Using invite code: <strong>{code}</strong></p>
        ) : (
          <p style={{ textAlign: 'center' }}>No invite code found. Access may be limited.</p>
        )}
        {/* Add your actual invite page form/content here */}
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Welcome to the future of AI access.
        </p>
      </div>
    </div>
  );
}

// This is the page component that wraps the content in Suspense
export default function InvitePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', background: '#000', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
      }}>
        Loading Exprezzzo Invite...
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}