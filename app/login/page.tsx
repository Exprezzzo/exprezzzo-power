'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TEMPORARY: Skip auth and go directly to playground
    // Remove this after fixing Firebase
    router.push('/playground');
    return;

    /* COMMENTED OUT BROKEN AUTH
    try {
      // Your broken auth code here
    } catch (error) {
      setError('Login temporarily disabled. Click Skip to continue.');
    }
    */
  };

  const handleSkip = () => {
    // Direct access to playground without auth
    router.push('/playground');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-96">
        <h1 className="text-2xl font-bold text-white mb-6">EXPREZZZO Power</h1>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white rounded"
          />
          
          <input
            type="password"
            placeholder="Password (optional)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white rounded"
          />
          
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleSkip}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded font-bold"
            >
              🚀 Skip Login - Use Playground Now
            </button>
            
            <button
              type="submit"
              className="w-full bg-gray-600 hover:bg-gray-700 text-gray-300 py-2 rounded text-sm"
            >
              Login (Currently Disabled)
            </button>
          </div>
        </form>
        
        <p className="text-gray-400 text-sm mt-4 text-center">
          Auth is temporarily disabled. Click "Skip Login" to access the playground.
        </p>
      </div>
    </div>
  );
}