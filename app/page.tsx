// app/page.tsx
import Link from 'next/link';
import { UserButton } from "@clerk/nextjs"; // Assuming you use Clerk for Auth
import { Brain, Zap, Gem, Rocket } from 'lucide-react'; // Example icons
// Corrected import: Use named import for PaymentButton
import { PaymentButton } from '@/components/PaymentButton'; // Changed from default to named import

export default function HomePage() {
  // Example usage for an authenticated user (Clerk)
  const isAuthenticated = true; // Replace with actual auth check if not using Clerk

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <header className="absolute top-4 right-4 z-10">
        {/* If using Clerk, you would typically render: <UserButton afterSignOutUrl="/" /> */}
        {/* For now, a placeholder or direct link */}
        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <UserButton afterSignOutUrl="/" /> {/* Example for Clerk */}
            <Link href="/dashboard" className="text-blue-400 hover:underline">
              Dashboard
            </Link>
          </div>
        ) : (
          <Link href="/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        )}
      </header>

      <h1 className="text-6xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
        Exprezzzo Power
      </h1>

      <p className="text-xl text-center text-gray-300 mb-10 max-w-2xl">
        Your unified, lightning-fast, and affordable AI API aggregator and web playground.
        <br />One API, All AI. One Platform, All Users.
      </p>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
        <Link href="/playground" className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center">
          <Brain className="mr-2" size={24} /> Start AI Playground
        </Link>
        <Link href="/api-keys" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center">
          <Zap className="mr-2" size={24} /> Get API Key
        </Link>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center max-w-4xl w-full">
        <div className="bg-gray-800 p-8 rounded-lg shadow-md">
          <h2 className="text-3xl font-bold mb-4 flex items-center justify-center">
            <Gem className="mr-2" size={28} /> AI Playground
          </h2>
          <p className="text-gray-300">
            Intuitive chat interface, model selection, document Q&A, and conversation history.
          </p>
          <Link href="/playground" className="mt-4 inline-block text-blue-400 hover:underline">Learn More & Try</Link>
        </div>
        <div className="bg-gray-800 p-8 rounded-lg shadow-md">
          <h2 className="text-3xl font-bold mb-4 flex items-center justify-center">
            <Rocket className="mr-2" size={28} /> API Aggregator
          </h2>
          <p className="text-gray-300">
            Access leading AI models through a single, streamlined API at discounted rates.
          </p>
          <Link href="/api-keys" className="mt-4 inline-block text-blue-400 hover:underline">View Docs & Pricing</Link>
        </div>
      </section>

      {/* Example of where PaymentButton might be used, if applicable to the homepage */}
      <div className="mt-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to unlock full power?</h2>
        <p className="text-lg text-gray-300 mb-6">Upgrade your account for unlimited access and advanced features.</p>
        <PaymentButton productName="Power Plan" priceId="price_12345" /> {/* Example usage */}
      </div>

      <footer className="mt-16 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Exprezzzo Power. All rights reserved.
      </footer>
    </div>
  );
}
