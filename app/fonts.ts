import localFont from 'next/font/local';

export const thnocentricFont = localFont({
  src: '../public/fonts/thnocentric-rg.ttf',
  variable: '--font-thnocentric',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});