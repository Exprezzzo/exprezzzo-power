'use client';

import Link from 'next/link';
import { Shield, Zap, Users, TrendingDown, ChevronRight, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Shield className="w-20 h-20 text-amber-500" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="text-amber-500">Exprezzzo</span> Power
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Premium AI for Everyone • 40% Cheaper Than Direct APIs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg transform hover:scale-105"
              >
                Start Chatting
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
              <button className="inline-flex items-center px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur">
                View Pricing
                <TrendingDown className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-amber-500/10 to-transparent p-8 rounded-2xl border border-amber-500/20">
            <Zap className="w-12 h-12 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Lightning Fast</h3>
            <p className="text-gray-400">
              Groq-powered responses in under 250ms. No waiting, just answers.
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-transparent p-8 rounded-2xl border border-emerald-500/20">
            <TrendingDown className="w-12 h-12 text-emerald-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">40% Savings</h3>
            <p className="text-gray-400">
              Community buying power means you pay 40% less than direct API access.
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-transparent p-8 rounded-2xl border border-purple-500/20">
            <Users className="w-12 h-12 text-purple-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Community First</h3>
            <p className="text-gray-400">
              No vendor lock-in. Export anytime. Your data, your rules.
            </p>
          </div>
        </div>
      </div>

      {/* Robin Hood Mission */}
      <div className="bg-black/50 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">The Robin Hood Protocol</h2>
          <p className="text-lg text-gray-300 mb-8">
            We believe premium AI should be accessible to everyone, not just enterprises.
            By pooling community resources, we negotiate better rates and pass the savings to you.
          </p>
          <div className="flex justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-amber-500 fill-current" />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">Trusted by 10,000+ developers</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500">
            © 2025 Exprezzzo Power • Democratizing AI for Everyone
          </p>
        </div>
      </footer>
    </div>
  );
}
