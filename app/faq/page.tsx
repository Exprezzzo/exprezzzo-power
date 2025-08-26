// app/faq/page.tsx
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
      <p className="text-gray-300 mb-6">This page for {APP_NAME} is under construction. Coming soon!</p>
      <Link href="/pricing" className="text-blue-400 hover:underline">Back to Pricing</Link>
    </div>
  );
}
