// app/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic'; // Import dynamic for client-side loading
import { ArrowRight } from 'lucide-react'; // Assuming you use this icon

// Dynamically import PaymentButton to ensure it's client-side rendered
// This resolves the "Element type is invalid" and "does not contain a default export" issues
const DynamicPaymentButton = dynamic(
  () => import('@/components/PaymentButton').then(mod => mod.PaymentButton),
  { ssr: false } // Crucial: This ensures the component is only rendered on the client
);

export default function LandingPage() {
  const isUserAuthenticated = false; // This would typically come from useAuth or server session check

  // Placeholder priceId for testing; replace with your actual Stripe Price ID
  const testPriceId = 'price_12345'; // <<-- REPLACE THIS WITH YOUR ACTUAL STRIPE TEST PRICE ID (e.g., from your Stripe Dashboard)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <Link href="/" className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors">
          Exprezzzo Power
        </Link>
        <nav className="space-x-4">
          {!isUserAuthenticated ? (
            <>
              <Link href="/login" className="text-blue-300 hover:text-blue-200 transition-colors">
                Login
              </Link>
              <Link href="/signup" className="text-blue-300 hover:text-blue-200 transition-colors">
                Sign Up
              </Link>
            </>
          ) : (
            <Link href="/playground" className="text-blue-300 hover:text-blue-200 transition-colors">
              Go to Playground
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl z-0">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 animate-fade-in-up">
          Unlock the <span className="text-blue-400">Power of AI</span>. Simplified.
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl animate-fade-in-up delay-200">
          One API, all AI. Get lightning-fast, affordable access to top AI models like GPT-4o, Llama 3, Gemini, and Claude Opus.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mb-12 animate-fade-in-up delay-400">
          <Link href="/pricing" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center justify-center group">
            Explore Pricing
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/dashboard" className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center justify-center group">
            Developer API
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Example of where PaymentButton would be used, e.g., for a direct purchase CTA */}
        <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-xl border border-gray-700 animate-fade-in-up delay-600">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-300 mb-6">Purchase a Power Plan instantly and gain full access.</p>
          <DynamicPaymentButton priceId={testPriceId}>
            Get Power Access Now
          </DynamicPaymentButton>
        </div>
      </main>

      <footer className="mt-12 text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Exprezzzo Power. All rights reserved.
      </footer>
    </div>
  );
}