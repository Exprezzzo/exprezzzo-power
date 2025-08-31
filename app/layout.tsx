import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Exprezzzo Power - AI for Everyone',
  description: '40% Cheaper AI Access - Robin Hood of AI',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="min-h-screen relative">
          {children}
        </div>
      </body>
    </html>
  )
}