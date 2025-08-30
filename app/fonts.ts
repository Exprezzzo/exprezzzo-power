import { Inter } from 'next/font/google';

export const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

// For now, we'll use system fonts for the brand font
// until we have a proper font file
export const thnocentricFont = {
  variable: '--font-thnocentric',
  className: 'font-mono' // fallback to monospace
};