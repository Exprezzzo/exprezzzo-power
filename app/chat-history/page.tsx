// app/chat-history/page.tsx
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
export default function ChatHistoryPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4">Chat History</h1>
      <p className="text-gray-300 mb-6">This page for {APP_NAME} is under construction. Coming soon!</p>
      <Link href="/playground" className="text-blue-400 hover:underline">Go to Playground</Link>
    </div>
  );
}
