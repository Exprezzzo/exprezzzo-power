import type { Metadata } from 'next';
import { inter, thnocentricFont } from './fonts';
import { Providers } from './providers';
import './globals.css';


export const metadata: Metadata = {
  title: 'EXPREZZZ Power',
  description: '40% Cheaper AI for Everyone',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${thnocentricFont.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}