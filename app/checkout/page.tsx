// app/checkout/page.tsx
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Keep this line
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Call the hook and store its value

  // Now you can use searchParams, for example:
  const orderId = searchParams.get('orderId');
  console.log('Order ID from URL:', orderId);

  // ... rest of your component logic
  return (
    <div>
      <h1>Checkout Page</h1>
      {orderId && <p>Processing order: {orderId}</p>}
      {/* ... */}
    </div>
  );
}
