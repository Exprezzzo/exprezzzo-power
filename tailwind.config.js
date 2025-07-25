/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Scan all files in app/
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // Scan all files in pages/
    './components/**/*.{js,ts,jsx,tsx,mdx}', // Scan all files in components/
    './hooks/**/*.{js,ts,jsx,tsx,mdx}', // Scan all files in hooks/ (if they contain JSX/TSX)
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        blob: 'blob 7s infinite',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'fade-in-delay': 'fade-in 0.6s ease-out 0.2s forwards',
        'fade-in-delay-2': 'fade-in 0.6s ease-out 0.4s forwards',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
