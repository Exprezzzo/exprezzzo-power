import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Exprezzzo Power
            </h1>
            <Link href="/playground">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Compare AI models,
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              save 40% on costs
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
            Access GPT-4, Claude, Gemini, and 50+ more models through one unified API.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-20">
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
              <p className="text-4xl font-bold text-white mb-2">40%</p>
              <p className="text-gray-400">Cost Savings</p>
            </div>
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
              <p className="text-4xl font-bold text-white mb-2">50+</p>
              <p className="text-gray-400">AI Models</p>
            </div>
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
              <p className="text-4xl font-bold text-white mb-2">99.9%</p>
              <p className="text-gray-400">Uptime</p>
            </div>
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
              <p className="text-4xl font-bold text-white mb-2">10k+</p>
              <p className="text-gray-400">Active Users</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
