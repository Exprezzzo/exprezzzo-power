'use client';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[var(--vegas-gold-standard)] to-[var(--vegas-gold-neon)] bg-clip-text text-transparent">
              Exprezzzo Power
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-2">
            Advanced AI Chat Platform
          </p>
          <p className="text-lg text-[var(--text-secondary)] opacity-80">
            40% Cheaper • All Models • One Platform
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/login')}
            className="btn-vegas-primary text-lg"
          >
            Get Started
          </button>
          <button
            onClick={() => router.push('/playground')}
            className="px-8 py-3 rounded-lg border-2 border-[var(--vegas-gold-standard)] text-[var(--vegas-gold-standard)] hover:bg-[var(--vegas-gold-standard)] hover:text-[var(--bg-chocolate-dark)] transition-all font-semibold"
          >
            Try Playground
          </button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-vegas text-center">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="text-[var(--vegas-gold-standard)] font-semibold mb-2">Fast & Reliable</h3>
            <p className="text-sm opacity-80">Lightning-fast responses with 99.9% uptime</p>
          </div>
          <div className="card-vegas text-center">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-[var(--vegas-gold-standard)] font-semibold mb-2">40% Cheaper</h3>
            <p className="text-sm opacity-80">Best prices for premium AI models</p>
          </div>
          <div className="card-vegas text-center">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="text-[var(--vegas-gold-standard)] font-semibold mb-2">All Models</h3>
            <p className="text-sm opacity-80">GPT-4, Claude, Gemini, and more</p>
          </div>
        </div>
      </div>
    </div>
  );
}