import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <nav className="surface border-b border-gold/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold gold-gradient-text brand-font">
            EXPREZZZ Power
          </h1>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-5xl font-bold brand-font">
            Compare AI models, APIs, and prices
          </h2>
          
          <div className="space-y-2 text-lg">
            <p className="gold-gradient-text font-semibold">
              No lock-in. Always the best deal.
            </p>
            <p className="text-muted">
              Transparent 50% margins — always fair.
            </p>
            <p className="text-muted">
              Your data, your models, your savings.
            </p>
          </div>

          <div className="pt-8">
            <button className="cta-button brand-font text-lg">
              Start Saving 40% Today
            </button>
          </div>
        </div>
      </section>

      {/* Power Tier Card Example */}
      <section className="px-6 py-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="surface p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-4">Community</h3>
            <p className="text-muted">Free forever</p>
          </div>
          
          <div className="power-tier-card surface p-6 rounded-xl border-2 border-gold">
            <h3 className="text-xl font-bold mb-4 gold-gradient-text">Power</h3>
            <p className="text-muted">40% cheaper than direct</p>
          </div>
          
          <div className="surface p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-4">Enterprise</h3>
            <p className="text-muted">Custom pricing</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="surface border-t border-gold/20 px-6 py-8 mt-20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="gold-gradient-text font-semibold brand-font">
            Built by EXPREZZZ Power • Powered by Hurricane Power
          </p>
          <p className="text-muted text-sm mt-2">
            © 2025 EXPREZZZ Power. Robin Hood of AI.
          </p>
        </div>
      </footer>
    </main>
  );
}