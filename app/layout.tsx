import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { thnocentricFont } from './fonts';
import { Providers } from './providers';
import NavBar from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'EXPREZZZ Power - 40% Cheaper AI',
  description: 'Compare AI models, APIs, and prices. No lock-in. Always the best deal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = false; // Would check Firebase claims in production

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${thnocentricFont.variable} font-sans min-h-screen flex flex-col`}>
        <Providers>
          <NavBar isAdmin={isAdmin} />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}