'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Play, BarChart3, User, LogOut } from 'lucide-react';

export default function Navigation() {
  const { user, logOut } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/playground', icon: Play, label: 'Playground' },
    { href: '/dashboard', icon: BarChart3, label: 'Dashboard' }
  ];

  return (
    <nav className='fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-[#FFD700]/20'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          {/* Logo */}
          <Link href='/' className='text-2xl font-bold text-[#FFD700]'>
            EXPREZZZO
          </Link>

          {/* Navigation Items */}
          <div className='hidden md:flex items-center space-x-8'>
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  pathname === href
                    ? 'bg-[#FFD700]/20 text-[#FFD700]'
                    : 'text-gray-300 hover:text-[#FFD700] hover:bg-[#FFD700]/10'
                }`}
              >
                <Icon className='w-5 h-5' />
                {label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className='flex items-center gap-4'>
            <div className='hidden md:flex items-center gap-2 text-gray-300'>
              <User className='w-5 h-5' />
              <span className='text-sm'>{user.email}</span>
            </div>
            
            <button
              onClick={logOut}
              className='flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors'
            >
              <LogOut className='w-5 h-5' />
              <span className='hidden sm:block'>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className='md:hidden border-t border-[#FFD700]/20'>
        <div className='flex items-center justify-around py-2'>
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                pathname === href
                  ? 'text-[#FFD700]'
                  : 'text-gray-400 hover:text-[#FFD700]'
              }`}
            >
              <Icon className='w-5 h-5' />
              <span className='text-xs'>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}