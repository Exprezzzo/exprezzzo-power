// app/layout.tsx
// Corrected to eliminate whitespace issues around <html> and <body> tags.
// Ensure you replace the ENTIRE FILE content with this.

import './globals.css'; // This import should be at the very top.

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

// If you have these components/contexts in your project, ensure their imports are here.
// Otherwise, you can remove these comments and the commented-out usage in the JSX below.
// import { AuthProvider } from '@/context/AuthContext';
// import { FirebaseInit } from '@/components/FirebaseInit';
// import { PWAPrompt } from '@/components/PWAPrompt';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Exprezzzo Power - One API for All AI',
  description: 'Save 40% on AI API costs with intelligent routing for LLMs.',
};

// If you are making this a PWA and want to define viewport metadata:
// import type { Viewport } from 'next';
// export const viewport: Viewport = {
//   themeColor: '#000000',
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        {/* If you have global context providers, wrap children here: */}
        {/* <AuthProvider> */}
          {/* <FirebaseInit /> */}
          {children}
          {/* <PWAPrompt /> */}
        {/* </AuthProvider> */}
      </body>
    </html>
  );
}