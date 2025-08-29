"use client";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bgDark to-surfaceDark dark:from-bgLight dark:to-surfaceLight">
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 mb-8">
          <span className="text-primary">Now supporting 50+ AI models</span>
        </div>
        
        <h1 className="text-6xl font-bold mb-6">
          Compare AI models,<br/>save 40% on costs
        </h1>
        
        <p className="text-xl mb-12 text-gray-400">
          Access GPT-4, Claude, Gemini, and 50+ more models through one unified API.
        </p>
        
        <div className="flex gap-4 justify-center">
          <a 
            href="/compare" 
            className="px-8 py-3 bg-primary text-black rounded-lg font-bold"
          >
            Try Free
          </a>
          <a 
            href="/pricing" 
            className="px-8 py-3 glass rounded-lg font-bold"
          >
            See Pricing
          </a>
        </div>
        
        <div className="grid grid-cols-4 gap-8 max-w-4xl mx-auto mt-20">
          {[
            { label: "Cost Savings", value: "40%" },
            { label: "AI Models", value: "50+" },
            { label: "Uptime", value: "99.9%" },
            { label: "Active Users", value: "10k+" }
          ].map(stat => (
            <div key={stat.label} className="glass p-6">
              <p className="text-4xl font-bold text-primary mb-2">{stat.value}</p>
              <p className="text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}