import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { thnocentric } from "./fonts/thnocentric-rg";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Express Power Network - AI for Everyone",
  description: "Express AI Protocol - Save 50% on AI costs",
  manifest: "/manifest.json"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${thnocentric.variable} dark`}>
      <body className={`${inter.className} bg-bgDark dark:bg-bgLight text-textDark dark:text-textLight`}>
        <nav className="fixed top-0 w-full z-50 bg-glass backdrop-blur-md border-b border-gray-800">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-brand text-primary">Express Power</h1>
            <div className="flex items-center gap-6">
              <a href="/chat" className="hover:text-primary">Chat</a>
              <a href="/models" className="hover:text-primary">Models</a>
              <a href="/pricing" className="hover:text-primary">Pricing</a>
              <a href="/compare" className="hover:text-primary">Compare</a>
              <a href="/referrals" className="hover:text-primary">Network</a>
              <ThemeToggle />
            </div>
          </div>
        </nav>
        <main className="pt-20">{children}</main>
      </body>
    </html>
  );
}