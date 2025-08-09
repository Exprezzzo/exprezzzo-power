'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Brain, Zap, Gem, Rocket } from 'lucide-react';
import { PaymentButton } from '@/components/PaymentButton';

export default function HomePage() {
  const { user, logOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <header className="absolute top-4 right-4 z-10">
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm">{user.email}</span>
            <button
              onClick={logOut}
              className="text-blue-400 hover:underline"
            >
              Logout
            </button>
            <Link
              href="/dashboard"
              className="text-blue-400 hover:underline"
            >
              Dashboard
            </Link>
          </div>
        ) : (
          <Link href="/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        )}
      </header>

      <main className="flex flex-col items-center text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to EXPREZZZO Power</h1>
        <p className="mb-8 max-w-lg">
          The unified AI orchestration platform — route prompts to multiple
          providers for optimal performance, cost, and reliability.
        </p>

        {/* Icons Section */}
        <div className="flex space-x-6 mb-8">
          <div className="flex flex-col items-center">
            <Brain className="h-8 w-8 text-blue-400" />
            <span className="mt-2 text-sm">Intelligence</span>
          </div>
          <div className="flex flex-col items-center">
            <Zap className="h-8 w-8 text-yellow-400" />
            <span className="mt-2 text-sm">Speed</span>
          </div>
          <div className="flex flex-col items-center">
            <Gem className="h-8 w-8 text-green-400" />
            <span className="mt-2 text-sm">Value</span>
          </div>
          <div className="flex flex-col items-center">
            <Rocket className="h-8 w-8 text-red-400" />
            <span className="mt-2 text-sm">Launch</span>
          </div>
        </div>

        {/* Payment Button */}
        <PaymentButton
          priceId="price_123456789"
          buttonText="Get Started"
        />
      </main>
    </div>
  );
}
