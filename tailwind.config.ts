import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './public/**/*.svg'
  ],
  safelist: [
    { pattern: /(bg|text|border)-(yellow|amber|gray|black|red|green|blue|purple|violet|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/ },
    { pattern: /(from|to|via)-(yellow|amber|gray|purple|violet|pink|rose)-(300|400|500|600|700)/ },
    { pattern: /animate-(bounce|pulse|spin|ping|fade|slide)/ },
    'delay-100',
    'delay-200',
    'delay-300',
    'backdrop-blur-sm',
    'backdrop-blur-md',
    'backdrop-blur-lg',
    'backdrop-blur-xl',
    'translate-x-0',
    '-translate-x-full',
    'z-40',
    'z-50',
    'fixed',
    'inset-0',
    'transform',
    'transition-transform',
    'duration-300',
    'opacity-0',
    'opacity-50',
    'opacity-100',
    'min-h-screen',
    'max-w-xs',
    'max-w-2xl',
    'rounded-lg',
    'rounded-2xl',
    'shadow-lg',
    'hover:bg-gray-700',
    'hover:bg-gray-800',
    'hover:bg-yellow-700',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed'
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      animation: {
        'bounce': 'bounce 1s infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
