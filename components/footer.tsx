'use client';

import Link from 'next/link';
import { 
  Sparkles, 
  Github, 
  Twitter, 
  Mail, 
  MapPin, 
  Heart,
  MessageCircle,
  DollarSign,
  Cpu,
  Users,
  FileText,
  Shield
} from 'lucide-react';

const navigation = {
  product: [
    { name: 'Chat', href: '/chat', icon: MessageCircle },
    { name: 'Pricing', href: '/pricing', icon: DollarSign },
    { name: 'Models', href: '/models', icon: Cpu },
    { name: 'Referrals', href: '/referrals', icon: Users }
  ],
  company: [
    { name: 'About', href: '/about', icon: Heart },
    { name: 'Blog', href: '/blog', icon: FileText },
    { name: 'Contact', href: '/contact', icon: Mail },
    { name: 'Privacy', href: '/privacy', icon: Shield }
  ],
  social: [
    { name: 'GitHub', href: 'https://github.com/exprezzzo', icon: Github },
    { name: 'Twitter', href: 'https://twitter.com/exprezzzo', icon: Twitter },
    { name: 'Email', href: 'mailto:hello@exprezzzo.com', icon: Mail }
  ]
};

export default function Footer() {
  return (
    <footer className="bg-gradient-to-t from-black via-chocolate-darker to-chocolate-dark border-t border-chocolate-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center space-x-3 group mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-gold to-gold-dark flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Sparkles className="w-7 h-7 text-black" />
              </div>
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
                  EXPREZZZ
                </div>
                <div className="text-sm font-medium text-gray-400">
                  POWER
                </div>
              </div>
            </Link>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Robin Hood AI pricing for everyone. We're taking from the AI rich 
              and giving to the developer poor. 40-60% cheaper than direct APIs.
            </p>
            <div className="flex space-x-4">
              {navigation.social.map((item) => {
                const IconComponent = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="w-10 h-10 bg-chocolate-surface/20 border border-chocolate-surface/30 rounded-lg flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold/30 hover:bg-gold/10 transition-all duration-200"
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Product</h3>
            <ul className="space-y-4">
              {navigation.product.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="flex items-center space-x-3 text-gray-300 hover:text-gold transition-colors duration-200 group"
                    >
                      <IconComponent className="w-4 h-4 text-gray-500 group-hover:text-gold transition-colors" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Company</h3>
            <ul className="space-y-4">
              {navigation.company.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="flex items-center space-x-3 text-gray-300 hover:text-gold transition-colors duration-200 group"
                    >
                      <IconComponent className="w-4 h-4 text-gray-500 group-hover:text-gold transition-colors" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Newsletter & Stats */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Stay Updated</h3>
            <p className="text-gray-300 text-sm mb-4">
              Get the latest updates on new models and pricing improvements.
            </p>
            <div className="space-y-3 mb-6">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-chocolate-surface/20 border border-chocolate-surface/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
              />
              <button className="w-full bg-gradient-to-r from-gold to-gold-dark text-black px-4 py-3 rounded-lg font-semibold text-sm hover:from-gold-dark hover:to-gold transition-all duration-200">
                Subscribe
              </button>
            </div>
            
            {/* Quick Stats */}
            <div className="bg-chocolate-surface/20 border border-chocolate-surface/30 rounded-lg p-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gold mb-1">$2.4M+</div>
                <div className="text-xs text-gray-400 mb-3">Total Saved by Developers</div>
                <div className="flex items-center justify-center space-x-2 text-xs text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Live Savings Counter</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-chocolate-surface/30 mt-16 pt-8">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>© 2024 EXPREZZZ POWER. All rights reserved.</span>
              <div className="flex items-center space-x-1">
                <span>Made with</span>
                <Heart className="w-4 h-4 text-red-400 fill-current" />
                <span>for developers</span>
              </div>
            </div>

            {/* Robin Hood Tagline */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-gold/10 to-gold-dark/10 border border-gold/20 rounded-full px-4 py-2">
                <MapPin className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-gold">
                  Serving developers worldwide
                </span>
              </div>
            </div>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap items-center justify-center space-x-6 mt-6 text-xs text-gray-500">
            <Link href="/terms" className="hover:text-gold transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-gold transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/cookies" className="hover:text-gold transition-colors">
              Cookie Policy
            </Link>
            <span>•</span>
            <Link href="/acceptable-use" className="hover:text-gold transition-colors">
              Acceptable Use
            </Link>
            <span>•</span>
            <Link href="/support" className="hover:text-gold transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Action */}
      <div className="fixed bottom-6 right-6 z-40">
        <Link
          href="/chat"
          className="w-14 h-14 bg-gradient-to-r from-gold to-gold-dark text-black rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 group"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </Link>
      </div>
    </footer>
  );
}