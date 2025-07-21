// app/layout.tsx
// Corrected to import globals.css for styling.

import './globals.css'; // ADD THIS LINE AT THE VERY TOP!

import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Assuming you use Inter font

// Assuming you have AuthProvider, FirebaseInit, PWAPrompt components
// based on previous analysis. If not, remove these imports for now.
// import { AuthProvider } from '@/context/AuthContext';
// import { FirebaseInit } from '@/components/FirebaseInit';
// import { PWAPrompt } from '@/components/PWAPrompt'; // If you have this PWA component

const inter = Inter({ subsets: ['latin'] }); // If using Inter font

export const metadata: Metadata = {
  title: 'Exprezzzo Power - One API for All AI',
  description: 'Save 40% on AI API costs with intelligent routing for LLMs.',
};

// If you are making this a PWA, you might also need this:
// export const viewport: Viewport = {
//   themeColor: '#000000',
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}> {/* Use inter.className if using Inter font */}
      <body style={{ margin: 0, padding: 0 }}>
        {/* Wrap children with AuthProvider, FirebaseInit, etc. if you have them */}
        {/* <AuthProvider> */}
          {/* <FirebaseInit /> */}
          {children}
          {/* <PWAPrompt /> */}
        {/* </AuthProvider> */}
      </body>
    </html>
  );
}