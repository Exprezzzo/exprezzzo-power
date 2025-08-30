"use client";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bgDark to-surfaceDark">
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 mb-8">
          <span className="text-primary">Express Power Network - 50+ AI Models</span>
        </div>
        
        <h1 className="text-6xl font-brand mb-6">
          Compare AI models,<br/>save with Express AI Protocol
        </h1>
        
        <p className="text-xl mb-4 text-gray-400">No lock-in. Always the best deal.</p>
        <p className="text-lg mb-4 text-gray-400">Transparent 50% margins — always fair.</p>
        <p className="text-lg mb-12 text-gray-400">Your data, your models, your savings.</p>
        
        <div className="flex gap-4 justify-center">
          <a 
            href="/compare" 
            className="px-8 py-3 bg-primary text-black rounded-lg font-bold"
          >
            Start Building
          </a>
          <a 
            href="/pricing" 
            className="px-8 py-3 glass rounded-lg font-bold"
          >
            View Pricing
          </a>
        </div>
      </section>
    </div>
  );
}