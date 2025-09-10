import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Vegas Gold Brand Colors
        'vegas-gold': 'var(--vegas-gold)',
        'vegas-gold-light': 'var(--vegas-gold-light)',
        'vegas-gold-dark': 'var(--vegas-gold-dark)',
        // Chocolate Shimmer
        'bg-dark': 'var(--bg-dark)',
        'bg-dark-secondary': 'var(--bg-dark-secondary)',
        // Desert Sand
        'desert-sand': 'var(--desert-sand)',
        'desert-sand-dark': 'var(--desert-sand-dark)',
        // Legacy support
        gold: 'var(--gold)',
        'gold-dark': 'var(--gold-dark)',
        'gold-darker': 'var(--gold-darker)',
      },
      animation: {
        'shimmer-sweep': 'shimmer-sweep 8s ease-in-out infinite',
        'shimmer': 'shimmer 8s ease-in-out infinite',
      },
      keyframes: {
        'shimmer-sweep': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'shimmer': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' }
        }
      }
    },
  },
  plugins: [],
}

export default config
