// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth'; // Assuming useAuth is properly implemented with signIn and resetPassword
import { Mail, Lock, LogIn, AlertCircle, ArrowLeft } from 'lucide-react'; // Ensure all icons are imported
import { APP_NAME } from '@/lib/constants'; // Import APP_NAME

export default function LoginPage() {
  const router = useRouter();
  const { signIn, resetPassword } = useAuth(); // Assuming useAuth provides signIn and resetPassword methods
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false); // State to toggle password reset form
  const [resetSent, setResetSent] = useState(false); // State to confirm reset email sent

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (resetMode) {
        await resetPassword(email);
        setResetSent(true);
      } else {
        await signIn(email, password);
        router.push('/playground'); // Redirect to playground on successful login
      }
    } catch (err: any) {
      const errorMessages: { [key: string]: string } = {
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      };
      setError(errorMessages[err.code] || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to home
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            {APP_NAME}
          </h1>
          <p className="text-gray-400 mt-2">
            {resetMode ? 'Reset your password' : 'Sign in to your account'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
          {resetSent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Check your email</h2>
              <p className="text-gray-400 mb-6">
                We've sent a password reset link to {email}
              </p>
              <button
                onClick={() => {
                  setResetMode(false);
                  setResetSent(false);
                }}
                className="text-blue-400 hover:text-blue-300"
              >
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {!resetMode && (
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 flex items-start">
                  <AlertCircle className="text-red-400 mr-2 flex-shrink-0 mt-0.5" size={16} />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <LogIn size={20} className="mr-2" />
                    Sign In
                  </>
                )}
              </button>

              {!resetMode && (
                <button
                  type="button"
                  onClick={() => setResetMode(true)}
                  className="w-full text-center text-blue-400 hover:text-blue-300 text-sm"
                >
                  Forgot your password?
                </button>
              )}
            </form>
          )}

          {!resetMode && !resetSent && (
            <div className="mt-6 text-center">
              <span className="text-gray-400">New to {APP_NAME}? </span>
              <Link
                href="/signup"
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                Create an account
              </Link>
            </div>
          )}

          {resetMode && !resetSent && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setResetMode(false)}
                className="text-gray-400 hover:text-white"
              >
                Back to login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
