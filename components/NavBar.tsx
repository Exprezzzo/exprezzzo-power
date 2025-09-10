'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function NavBar({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navLinks = [
    { href: '/chat', label: 'Chat' },
    { href: '/playground', label: 'Playground' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/models', label: 'Models' },
    { href: '/referrals', label: 'Referrals' },
  ];

  if (isAdmin) {
    navLinks.push({ href: '/admin/dashboard', label: 'Admin' });
  }

  return (
    <nav className="flex items-center justify-between px-6 py-3 surface border-b border-gold/20 sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold font-brand gold-gradient-text hover:opacity-80">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-vegas-gold"
        >
          <path
            d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"
            fill="currentColor"
          />
        </svg>
        Exprezzz Power
      </Link>
      
      <div className="hidden md:flex items-center gap-4">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? 'gold-gradient-text' : 'hover:text-gold'}
          >
            {link.label}
          </Link>
        ))}
        <ThemeToggle />
      </div>

      <div className="md:hidden flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 surface border-b border-gold/20 p-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 hover:text-gold"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}