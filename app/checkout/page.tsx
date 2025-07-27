// app/checkout/page.tsx
import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation'; // Remove useSearchParams
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  // useSearchParams is no longer imported or used

  // ... rest of your component logic
  return (
    <div>
      <h1>Checkout Page</h1>
      {/* ... */}
    </div>
  );
}
