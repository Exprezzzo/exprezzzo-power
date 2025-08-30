import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl font-bold font-brand">
            Compare AI models, APIs, and prices
          </h1>
          
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
            <Link href="/pricing" className="inline-flex items-center px-5 py-3 rounded-2xl gold-gradient text-black font-brand cta-button">
              Get Started
            </Link>
          </div>
        </div>
      </section>

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
    </main>
  );
}