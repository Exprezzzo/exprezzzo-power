// app/dashboard/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth'; // Assuming useAuth is used for dashboard access
import { APP_NAME } from '@/lib/constants'; // Import APP_NAME
import { LogOut, Home, Key, Activity, Settings, UserCircle2 } from 'lucide-react'; // Import icons

export default function DashboardPage() {
  const { user, loading, logOut } = useAuth(); // Assuming useAuth provides logOut

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
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

  const handleLogout = async () => {
    try {
      await logOut();
      alert('Logged out successfully!');
      // Redirect to home page or login page after logout
      window.location.href = '/'; // Full refresh to clear client-side state
    } catch (error: any) {
      alert(`Logout failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          {APP_NAME} Dashboard
        </h1>
        <nav className="flex items-center space-x-4">
          <Link href="/" className="text-gray-400 hover:text-white flex items-center">
            <Home size={18} className="mr-1" /> Home
          </Link>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 flex items-center">
            <LogOut size={18} className="mr-1" /> Logout
          </button>
        </nav>
      </header>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-4 flex items-center">
          <UserCircle2 size={24} className="mr-2 text-blue-400" /> Welcome, {user.email || 'User'}!
        </h2>
        <p className="text-lg text-gray-300">
          This is your central hub for managing API keys, viewing usage statistics, and accessing developer documentation.
          {user.isPro ? (
            <span className="text-green-400 ml-2 font-semibold"> (Power User)</span>
          ) : (
            <span className="text-yellow-400 ml-2 font-semibold"> (Free Tier)</span>
          )}
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-2xl font-bold mb-3 text-green-400 flex items-center">
            <Key size={20} className="mr-2" /> API Keys
          </h3>
          <p className="text-gray-300 mb-4">Manage your API keys for accessing {APP_NAME} AI.</p>
          <Link href="/api-keys" className="text-blue-400 hover:underline">Go to API Keys</Link>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-2xl font-bold mb-3 text-purple-400 flex items-center">
            <Activity size={20} className="mr-2" /> Usage Analytics
          </h3>
          <p className="text-gray-300 mb-4">Monitor your AI API call and chat usage in real-time.</p>
          <Link href="/usage" className="text-blue-400 hover:underline">View Usage</Link>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-2xl font-bold mb-3 text-yellow-400 flex items-center">
            <Settings size={20} className="mr-2" /> Settings
          </h3>
          <p className="text-gray-300 mb-4">Manage your account settings and profile.</p>
          <Link href="/settings" className="text-blue-400 hover:underline">Account Settings</Link>
        </div>
      </section>

      <footer className="mt-12 text-gray-400 text-sm text-center">
        &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
