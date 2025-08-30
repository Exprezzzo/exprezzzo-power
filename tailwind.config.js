/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  safelist: [
    'from-chocolate-dark',
    'to-chocolate-darker',
    'from-desert-light',
    'to-desert-lighter',
    'bg-gradient-to-r',
    'from-gold',
    'via-gold-dark',
    'to-gold-darker',
  ],
  theme: {
    extend: {
      colors: {
        chocolate: {
          dark: '#2A1B14',
          darker: '#3B2720',
          surface: '#43302A',
          text: '#F5F3F1',
          textMuted: '#C4B8B1',
          // Keep existing colors for backward compatibility
          50: '#f9f5f3',
          100: '#f0e6e0',
          500: '#7b3f00',
          600: '#5d2f00',
          700: '#3e1f00',
          800: '#2e1700',
          900: '#1f0f00',
        },
        desert: {
          light: '#F5EBDD',
          lighter: '#EADCCB',
          surface: 'rgba(255,255,255,0.9)',
          text: '#1C1A19',
          textMuted: '#6B625C',
          // Keep existing colors for backward compatibility
          50: '#fdf8f0',
          100: '#f9ead4',
          200: '#f4dbb8',
          300: '#edc896',
          400: '#e5b574',
        },
        gold: {
          DEFAULT: '#FFD700',
          dark: '#FFB800',
          darker: '#E6A600',
        },
        sovereign: {
          // 🏠 House Prep: Colors for sovereign UI
          DEFAULT: '#4A90E2',
          dark: '#357ABD',
          light: '#6BA3E5',
        }
      },
      fontFamily: {
        brand: ['var(--font-thnocentric)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'gradient': 'gradient 8s ease infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'sovereign-glow': 'sovereign-glow 2s ease-in-out infinite', // 🏠 House Prep
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'sovereign-glow': {
          // 🏠 House Prep: Animation for local model indicator
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gold-gradient': 'linear-gradient(135deg, #FFD700 0%, #FFB800 50%, #E6A600 100%)',
      },
    },
  },
  plugins: [],
}