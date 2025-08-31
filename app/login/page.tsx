'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', email);
    router.push('/playground');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card-vegas">
          <h1 className="text-3xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-[var(--vegas-gold-standard)] to-[var(--vegas-gold-neon)] bg-clip-text text-transparent">
              Welcome Back
            </span>
          </h1>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full"
              />
            </div>
            
            <button
              type="submit"
              className="w-full btn-vegas-primary"
            >
              Sign In
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-[var(--text-secondary)]">
              Don't have an account?{' '}
              <a href="/register" className="text-[var(--vegas-gold-standard)] hover:text-[var(--vegas-gold-neon)] font-semibold">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}