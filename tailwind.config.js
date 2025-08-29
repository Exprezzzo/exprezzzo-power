import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFD700',
        bg: {
          dark: '#0D0F12',
          light: '#F2F3F5',
        },
        surface: {
          dark: '#15181D',
          light: '#E6E8EC',
        },
        text: {
          dark: '#E6EAF0',
          light: '#111316',
        },
      },
      borderColor: {
        glass: 'rgba(255,255,255,0.12)',
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '1.75rem',
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,0.35)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '6px',
        md: '10px',
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
