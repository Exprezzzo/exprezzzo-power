// app/layout.tsx
// Updated: Integrates the AuthProvider to manage global user state.

import './globals.css'; // This import should be at the very top.

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { AuthProvider } from '@/hooks/useAuth'; // NEW: Import AuthProvider

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Exprezzzo Power - One API for All AI',
  description: 'Save 40% on AI API costs with intelligent routing for LLMs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        {/* Wrap children with AuthProvider to provide auth context to all components */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}