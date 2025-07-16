'use client';
import { PaymentButton } from '@/components/PaymentButton';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-4">
            EXPREZZZO POWER
          </h1>
          <p className="text-2xl text-gray-300 mb-2">ONE API • ALL AI • 40% CHEAPER</p>
          <p className="text-xl text-green-400">⚡ Only 7 founding spots left ⚡</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400">234ms</div>
            <div className="text-gray-400">LIGHTNING FAST</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-400">99.9%</div>
            <div className="text-gray-400">UPTIME</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400">40%</div>
            <div className="text-gray-400">SAVINGS</div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <PaymentButton />
          <p className="text-gray-500 mt-4">30 days or $5.00 left • $99/mo after</p>
        </div>
      </div>
    </main>
  );
}