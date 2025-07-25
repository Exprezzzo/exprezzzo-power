// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Zap, Brain, Shield, Globe, Code, Users, CheckCircle, Sparkles, Mail, Lock } from 'lucide-react'; // Ensure all icons are imported
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { APP_NAME, PRICING } from '@/lib/constants'; // Import constants

// Dynamically import PaymentButton as it's a client component.
// It's a named export, so .then(mod => mod.PaymentButton) is correct.
const PaymentButton = dynamic(
  () => import('@/components/PaymentButton').then(mod => mod.PaymentButton),
  { ssr: false } // Crucial: This ensures the component is only rendered on the client
);

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly'); // Added for pricing section on landing

  // Use price IDs from constants
  const FOUNDING_PRICE_ID = PRICING.monthly.priceId;

  const features = [
    { icon: <Brain className="w-5 h-5" />, text: "Access to GPT-4o, Claude Opus, Gemini Pro" },
    { icon: <Zap className="w-5 h-5" />, text: "Lightning-fast API responses" },
    { icon: <Shield className="w-5 h-5" />, text: "Enterprise-grade security" },
    { icon: <Globe className="w-5 h-5" />, text: "Global CDN for low latency" },
    { icon: <Code className="w-5 h-5" />, text: "Simple REST API & SDKs" },
    { icon: <Users className="w-5 h-5" />, text: "Team collaboration features" },
  ];

  const handleGetStarted = () => {
    if (user?.isPro) {
      router.push('/playground');
    } else {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-6 lg:px-12 py-6">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          {APP_NAME}
        </Link>

        <div className="flex items-center gap-6">
          <Link href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</Link>
          <Link href="/docs" className="hover:text-blue-400 transition-colors">Docs</Link>

          {user ? (
            <Link href="/playground" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all">
              {user.isPro ? 'Open Playground' : 'Upgrade to Pro'}
            </Link>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-400 transition-colors">Sign In</Link>
              <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all">
                Start Free Trial
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-20 text-center">
        <h1 className="text-6xl md:text-8xl font-bold mb-6 animate-fade-in">
          <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            One API
          </span>
          <br />
          <span className="text-white">All AI Models</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto animate-fade-in-delay">
          Access GPT-4o, Claude Opus, Gemini Pro, and more through a single, unified API.
          Save 40% on costs with intelligent routing.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 animate-fade-in-delay-2">
          <button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>

          <Link
            href="/docs"
            className="bg-gray-800 hover:bg-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
          >
            View Documentation
            <Code className="w-5 h-5" />
          </Link>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <div className="text-4xl font-bold text-blue-400 mb-2">2.5M+</div>
            <div className="text-gray-400">API Calls Daily</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <div className="text-4xl font-bold text-purple-400 mb-2">99.9%</div>
            <div className="text-gray-400">Uptime SLA</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <div className="text-4xl font-bold text-pink-400 mb-2">40%</div>
            <div className="text-gray-400">Cost Savings</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Everything you need, nothing you don't</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-blue-600 transition-all">
              <div className="text-blue-400 mb-4">{feature.icon}</div>
              <p className="text-gray-300">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section - PUBLIC, NO LOGIN REQUIRED */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">Simple, transparent pricing</h2>
        <p className="text-xl text-gray-400 text-center mb-12">No hidden fees. Cancel anytime.</p>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-900 p-1 rounded-xl">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-lg transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
            <h3 className="text-2xl font-bold mb-4">Starter</h3>
            <div className="text-4xl font-bold mb-6">
              $0<span className="text-lg font-normal text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">100 API calls/day</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Access to GPT-3.5</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Community support</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center bg-gray-700 hover:bg-gray-600 py-3 rounded-lg transition-all"
            >
              Start Free
            </Link>
          </div>

          {/* Power User - Featured */}
          <div className="bg-gradient-to-b from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-2xl p-8 border-2 border-blue-600 relative transform scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-4">Power User</h3>
            <div className="text-4xl font-bold mb-6">
              ${billingPeriod === 'monthly' ? PRICING.monthly.price : PRICING.yearly.price}
              <span className="text-lg font-normal text-gray-400">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Unlimited API calls</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">All AI models (GPT-4o, Claude, etc.)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Priority support</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Advanced analytics</span>
              </li>
            </ul>
            <Link
              href={user ? `/checkout?plan=power&period=${billingPeriod}` : '/login'} // Redirect to login if not authenticated
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 py-3 rounded-lg transition-all font-semibold"
            >
              {user ? 'Get Power Access' : 'Login to Purchase'}
            </Link>
          </div>

          {/* Enterprise */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
            <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
            <div className="text-4xl font-bold mb-6">
              Custom
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Everything in Power</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Custom SLA</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Dedicated support</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">On-premise deployment</span>
              </li>
            </ul>
            <Link
              href="/contact"
              className="block w-full text-center bg-gray-700 hover:bg-gray-600 py-3 rounded-lg transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-20 text-center">
        <h2 className="text-3xl font-bold mb-12">Trusted by developers worldwide</h2>
        <div className="flex flex-wrap justify-center gap-8 opacity-50">
          {/* Add company logos here */}
          <div className="text-gray-400">YC Startup</div>
          <div className="text-gray-400">TechCrunch</div>
          <div className="text-gray-400">Product Hunt</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/changelog" className="hover:text-white">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://twitter.com/exprezzzo" className="hover:text-white">Twitter</a></li>
                <li><a href="https://github.com/exprezzzo" className="hover:text-white">GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
