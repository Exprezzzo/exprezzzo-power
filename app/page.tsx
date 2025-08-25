'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">
        EXPREZZZO Power
      </h1>
      
      <p className="text-gray-300 mb-8">AI Orchestration Platform</p>
      
      <div className="space-y-4">
        <button
          onClick={() => router.push('/playground')}
          className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-lg"
        >
          🚀 Launch Playground (No Login Required)
        </button>
        
        <div className="flex gap-4 text-sm">
          <span className="text-green-400">✅ OpenAI Active</span>
          <span className="text-green-400">✅ Anthropic Active</span>
          <span className="text-green-400">✅ Gemini Active</span>
          <span className="text-green-400">✅ Groq Active</span>
        </div>
      </div>
    </div>
  );
}