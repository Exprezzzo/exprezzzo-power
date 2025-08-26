/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './public/**/*.svg'
  ],
  safelist: [
    // Vegas Gold theme colors
    { pattern: /(bg|text|border)-(yellow|amber)-(400|500|600|700|800)/ },
    { pattern: /(bg|text|border)-(gray|black)-(50|100|200|300|400|500|600|700|800|900|950)/ },
    { pattern: /(bg|text|border)-(red|green|blue)-(400|500|600|700)/ },
    
    // Gradients
    { pattern: /(from|to|via)-(yellow|amber|gray)-(400|500|600|700)/ },
    
    // Animations
    'animate-bounce',
    'animate-pulse',
    'animate-blob',
    'animate-fade-in',
    'animate-fade-in-delay',
    'animate-fade-in-delay-2',
    'delay-100',
    'delay-200',
    
    // Backdrop effects
    'backdrop-blur-sm',
    'backdrop-blur-md',
    'backdrop-blur-lg',
    'backdrop-blur-xl',
    
    // Transform classes
    'translate-x-0',
    '-translate-x-full',
    'transform',
    'transition-transform',
    'transition-colors',
    'duration-300',
    
    // Positioning
    'fixed',
    'relative',
    'absolute',
    'inset-0',
    'z-40',
    'z-50',
    
    // Opacity
    'opacity-0',
    'opacity-20',
    'opacity-30',
    'opacity-50',
    'opacity-100',
    'bg-opacity-50',
    'border-opacity-20',
    
    // Sizing
    'w-72',
    'h-screen',
    'h-full',
    'min-h-screen',
    'max-w-xs',
    'max-w-2xl',
    
    // Spacing
    'p-2',
    'p-3',
    'p-4',
    'px-3',
    'px-4',
    'px-6',
    'py-1',
    'py-3',
    'gap-1',
    'gap-2',
    'gap-3',
    'space-y-2',
    'space-y-4',
    
    // Borders & Rounding
    'rounded',
    'rounded-lg',
    'rounded-2xl',
    'rounded-full',
    'border',
    'border-r',
    'border-b',
    'border-t',
    
    // Interactive states
    'hover:bg-gray-700',
    'hover:bg-gray-800',
    'hover:bg-yellow-700',
    'hover:text-yellow-500',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    
    // Flexbox
    'flex',
    'flex-1',
    'flex-col',
    'items-center',
    'justify-center',
    'justify-between',
    'justify-start',
    'justify-end',
    
    // Text
    'text-sm',
    'text-lg',
    'text-xl',
    'text-white',
    'text-black',
    'text-gray-400',
    'text-gray-500',
    'font-bold',
    'font-semibold',
    'placeholder-gray-400',
    'whitespace-pre-wrap',
    'break-words',
    
    // Misc
    'cursor-pointer',
    'overflow-y-auto',
    'shadow-lg',
    'md:hidden',
    'md:relative',
    'md:translate-x-0',
    'md:max-w-2xl',
    'focus:outline-none',
    'focus:border-yellow-600',
    'focus:border-yellow-500'
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