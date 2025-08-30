'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Sparkles, 
  MessageCircle, 
  DollarSign, 
  Cpu, 
  Users, 
  BarChart3,
  Crown
} from 'lucide-react';

const navigation = [
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Pricing', href: '/pricing', icon: DollarSign },
  { name: 'Models', href: '/models', icon: Cpu },
  { name: 'Referrals', href: '/referrals', icon: Users }
];

const adminNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 }
];

export default function NavBar({ isAdmin = false }: { isAdmin?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const allNavigation = [...navigation, ...(isAdmin ? adminNavigation : [])];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-chocolate-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-gold to-gold-dark flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Sparkles className="w-6 h-6 text-black" />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xl font-bold bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
                  EXPREZZZ
                </span>
                <span className="text-sm font-medium text-gray-400 hidden sm:inline">
                  POWER
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {allNavigation.map((item) => {
                const IconComponent = item.icon;
                const isActive = pathname === item.href || (item.href.startsWith('/admin') && pathname.startsWith('/admin'));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gold text-black shadow-lg shadow-gold/20'
                        : 'text-gray-300 hover:text-white hover:bg-chocolate-surface/30'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Admin Badge */}
              {isAdmin && (
                <div className="flex items-center space-x-2 ml-4 px-3 py-1 bg-gradient-to-r from-purple-600/20 to-purple-700/20 border border-purple-500/30 rounded-lg">
                  <Crown className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium text-purple-300">Admin</span>
                </div>
              )}

              {/* CTA Button */}
              <div className="ml-6 pl-6 border-l border-chocolate-surface/30">
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-gold to-gold-dark text-black px-4 py-2 rounded-lg text-sm font-semibold hover:from-gold-dark hover:to-gold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-chocolate-surface/30 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-chocolate-surface/30 bg-black/95 backdrop-blur-md">
            <div className="px-4 py-6 space-y-4">
              {allNavigation.map((item) => {
                const IconComponent = item.icon;
                const isActive = pathname === item.href || (item.href.startsWith('/admin') && pathname.startsWith('/admin'));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gold text-black shadow-lg shadow-gold/20'
                        : 'text-gray-300 hover:text-white hover:bg-chocolate-surface/30'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Admin Badge */}
              {isAdmin && (
                <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-purple-600/20 to-purple-700/20 border border-purple-500/30 rounded-lg">
                  <Crown className="w-5 h-5 text-purple-400" />
                  <span className="font-medium text-purple-300">Admin Access</span>
                </div>
              )}

              {/* Mobile CTA */}
              <div className="pt-4 border-t border-chocolate-surface/30">
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center bg-gradient-to-r from-gold to-gold-dark text-black px-4 py-3 rounded-lg font-semibold hover:from-gold-dark hover:to-gold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Spacer to prevent content from being hidden behind fixed navbar */}
      <div className="h-16" />
    </>
  );
}