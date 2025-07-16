'use client';
import { PaymentButton } from '@/components/PaymentButton';
import { useEffect, useState } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Lightning Background */}
      <div className="absolute inset-0">
        <div className="lightning-bg"></div>
        <div className="grid-overlay"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16">
        {/* Logo/Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-green-400 to-blue-500 rounded-lg blur opacity-75 animate-pulse"></div>
            <h1 className="relative text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-yellow-400 to-green-400 tracking-tight">
              EXPREZZZO
            </h1>
          </div>
          <div className="text-6xl md:text-8xl font-black text-white mt-2 tracking-wider lightning-text">
            POWER
          </div>
          <p className="text-xl md:text-2xl text-gray-300 mt-4 font-light">
            ONE API • ALL AI • 40% CHEAPER
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-400 font-bold">LIVE</span>
            <span className="text-gray-400">|</span>
            <span className="text-yellow-400 font-bold animate-pulse">⚡ 7 FOUNDING SPOTS LEFT</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
          {mounted && (
            <>
              <div className="stat-card group">
                <div className="stat-glow from-green-400 to-green-600"></div>
                <div className="relative p-6 text-center">
                  <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2 counter">234ms</div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider">Lightning Fast</div>
                  <div className="absolute top-0 right-0 text-green-400 opacity-20">⚡</div>
                </div>
              </div>

              <div className="stat-card group">
                <div className="stat-glow from-red-400 to-red-600"></div>
                <div className="relative p-6 text-center">
                  <div className="text-4xl md:text-5xl font-bold text-red-400 mb-2 counter">99.9%</div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider">Uptime SLA</div>
                  <div className="absolute top-0 right-0 text-red-400 opacity-20">🔥</div>
                </div>
              </div>

              <div className="stat-card group">
                <div className="stat-glow from-blue-400 to-blue-600"></div>
                <div className="relative p-6 text-center">
                  <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2 counter">40%</div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider">Cost Savings</div>
                  <div className="absolute top-0 right-0 text-blue-400 opacity-20">💰</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-4xl mx-auto">
          {['GPT-4', 'Claude 3', 'Gemini Pro', 'Llama 2'].map((model, i) => (
            <div key={model} className="feature-chip" style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="text-green-400 mr-2">✓</span>
              {model}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-8">
            <PaymentButton />
          </div>
          
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>🔒 Secure checkout</span>
            <span>•</span>
            <span>⚡ Instant access</span>
            <span>•</span>
            <span>💳 Cancel anytime</span>
          </div>

          <p className="mt-8 text-gray-400">
            <span className="text-yellow-400 font-bold">30 days</span> or{' '}
            <span className="text-green-400 font-bold">$5.00 left</span> in launch offer
          </p>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-16 border-t border-gray-800">
          <div className="text-center text-sm text-gray-500">
            <p>Trusted by developers from</p>
            <div className="flex items-center justify-center gap-8 mt-4 opacity-50">
              <span className="text-lg">Google</span>
              <span className="text-lg">Meta</span>
              <span className="text-lg">OpenAI</span>
              <span className="text-lg">Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}