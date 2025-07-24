// app/layout.tsx
// Updated: Integrates the AuthProvider to manage global user state.

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/hooks/useAuth'; // NEW: Import AuthProvider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Exprezzzo Power - AI API Aggregator",
  description: "One API, All AI Models - 40% Cheaper",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrap children with AuthProvider to provide auth context to all components */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}