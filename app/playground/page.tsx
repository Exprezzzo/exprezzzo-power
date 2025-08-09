'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function PlaygroundPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No user — send to login
        router.push('/login');
      } else if (!user.isPro) {
        // User exists but not Pro — send to pricing
        router.push('/pricing');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Loading...
      </div>
    );
  }

  if (!user || !user.isPro) {
    return null; // Redirecting
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Playground</h1>
      <p>Welcome, {user.email}! You have Pro access.</p>
      {/* Playground content goes here */}
    </div>
  );
}
