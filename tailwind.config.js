// tailwind.config.js
// Corrected to remove the 'plugins' property, relying solely on postcss.config.js for plugin definition.

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'exprezzzo-red': '#ad0000',
        'exprezzzo-blue': '#3577ae',
        'exprezzzo-purple': '#6f009d',
        'exprezzzo-gray': '#4a5568',
        'exprezzzo-gold-start': '#FFD700',
        'exprezzzo-gold-mid': '#FFA500',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  // Removed the 'plugins' array from here to avoid conflict with PostCSS setup
  // plugins: [], // This line is now removed
};