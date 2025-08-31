'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement Firebase Auth
    console.log('Login attempt:', email);
    router.push('/playground');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
      <div className="max-w-md w-full mx-4">
        <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-gold/20 p-8">
          <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-gold to-orange-500 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-gold/30 rounded-lg focus:outline-none focus:border-gold text-white"
                placeholder="you@example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-gold/30 rounded-lg focus:outline-none focus:border-gold text-white"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-gold to-orange-500 text-black font-bold rounded-lg hover:from-orange-500 hover:to-gold transition-all"
            >
              Sign In
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <a href="/register" className="text-gold hover:text-orange-500">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}