import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Expresso Power - AI for Everyone",
  description: "Compare AI models, save 40% on costs",
  manifest: "/manifest.json"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-bgDark dark:bg-bgLight text-textDark dark:text-textLight`}>
        <nav className="fixed top-0 w-full z-50 bg-glass backdrop-blur-md border-b border-gray-800">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">Expresso Power</h1>
            <div className="flex items-center gap-6">
              <a href="/models" className="hover:text-primary">Models</a>
              <a href="/pricing" className="hover:text-primary">Pricing</a>
              <a href="/compare" className="hover:text-primary">Compare</a>
              <a href="/referrals" className="hover:text-primary">Referrals</a>
              <ThemeToggle />
            </div>
          </div>
        </nav>
        <main className="pt-20">{children}</main>
      </body>
    </html>
  );
}