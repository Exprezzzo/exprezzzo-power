export const metadata = {
  title: 'Exprezzzo Power - One API for All AI',
  description: 'Save 40% on AI API costs with intelligent routing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}