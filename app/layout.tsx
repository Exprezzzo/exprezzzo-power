import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth/AuthProvider'
import { Toaster } from 'sonner'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'EXPREZZZ Power - AI Chat Platform',
  description: 'Advanced AI chat platform with voice capabilities, multi-provider support, and enterprise features.',
  keywords: 'AI, chat, voice, OpenAI, Anthropic, enterprise',
  authors: [{ name: 'EXPREZZZ Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'EXPREZZZ Power - AI Chat Platform',
    description: 'Advanced AI chat platform with voice capabilities',
    type: 'website',
    url: 'https://exprezzzo-power.vercel.app',
    siteName: 'EXPREZZZ Power',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EXPREZZZ Power - AI Chat Platform',
    description: 'Advanced AI chat platform with voice capabilities',
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFD700',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div id="root">
            {children}
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(17, 24, 39, 0.9)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(12px)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}