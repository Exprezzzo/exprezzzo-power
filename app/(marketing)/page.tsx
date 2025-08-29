'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <>
      {/* Navigation [EP-NV01-v1.0] */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-primary">Exprezzzo Power</h1>
              <div className="hidden md:flex gap-6">
                <Link href="/docs" className="hover:text-primary transition">Docs</Link>
                <Link href="/pricing" className="hover:text-primary transition">Pricing</Link>
                <Link href="/playground" className="hover:text-primary transition">Playground</Link>
                <Link href="/contact" className="hover:text-primary transition">Contact</Link>
              </div>
            </div>
            <div className="flex gap-4">
              <Link href="/signin" className="px-4 py-2 hover:text-primary">Sign In</Link>
              <Link href="/playground" className="px-6 py-2 bg-primary text-black rounded-lg font-semibold">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section [EP-HE01-v1.0] */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm">Now supporting 50+ AI models</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            Compare AI models, save 40% on costs, and build<br/>
            with the best. Access GPT-4, Claude, Gemini,<br/>
            and 50+ more models through one unified API.
          </h1>
          
          <div className="flex gap-4 justify-center mt-8">
            <Link href="/playground" className="px-8 py-3 bg-primary text-black rounded-lg font-semibold">
              Try Free
            </Link>
            <Link href="/pricing" className="px-8 py-3 glass rounded-lg font-semibold">
              See Pricing
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-8 max-w-4xl mx-auto mt-20">
            <div className="glass p-6">
              <p className="text-4xl font-bold text-primary">40%</p>
              <p className="text-sm mt-2">Cost Savings</p>
            </div>
            <div className="glass p-6">
              <p className="text-4xl font-bold">50+</p>
              <p className="text-sm mt-2">AI Models</p>
            </div>
            <div className="glass p-6">
              <p className="text-4xl font-bold">99.9%</p>
              <p className="text-sm mt-2">Uptime</p>
            </div>
            <div className="glass p-6">
              <p className="text-4xl font-bold">10k+</p>
              <p className="text-sm mt-2">Active Users</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
