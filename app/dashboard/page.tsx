// app/dashboard/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth'; // Assuming useAuth is used for dashboard access

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect unauthenticated users
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-800 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">You must be logged in to view the dashboard.</p>
          <Link href="/login" className="text-blue-400 hover:underline">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-blue-400">Developer Dashboard</h1>
        <nav>
          <Link href="/playground" className="text-blue-300 hover:text-blue-200 mr-4">
            AI Playground
          </Link>
          <Link href="/pricing" className="text-blue-300 hover:text-blue-200">
            Pricing
          </Link>
        </nav>
      </header>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-4">Welcome, {user.email}!</h2>
        <p className="text-lg text-gray-300">
          This is your central hub for managing API keys, viewing usage statistics, and accessing developer documentation.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-2xl font-bold mb-3 text-green-400">API Keys</h3>
          <p className="text-gray-300 mb-4">Manage your API keys for accessing Exprezzzo Power AI.</p>
          <Link href="/api-keys" className="text-blue-400 hover:underline">Go to API Keys</Link>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-2xl font-bold mb-3 text-purple-400">Usage Analytics</h3>
          <p className="text-gray-300 mb-4">Monitor your AI API call and chat usage in real-time.</p>
          <Link href="/usage" className="text-blue-400 hover:underline">View Usage</Link>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-2xl font-bold mb-3 text-yellow-400">Documentation</h3>
          <p className="text-gray-300 mb-4">Access comprehensive documentation and examples.</p>
          <Link href="/docs" className="text-blue-400 hover:underline">Read Docs</Link>
        </div>
      </section>

      <footer className="mt-12 text-gray-400 text-sm text-center">
        &copy; {new Date().getFullYear()} Exprezzzo Power. All rights reserved.
      </footer>
    </div>
  );
}
