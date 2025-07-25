// lib/constants.ts - Application constants
export const APP_NAME = 'Exprezzzo Power';
export const APP_DESCRIPTION = 'One API for All AI Models - 40% Cheaper, 10x Faster';

// Pricing
export const PRICING = {
  monthly: {
    price: 97,
    priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!,
    credits: 'unlimited',
  },
  yearly: {
    price: 931, // $97 * 12 = $1164. $931 is 20% off.
    priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID!,
    credits: 'unlimited',
    savings: 233, // 1164 - 931 = 233
  },
  free: {
    price: 0,
    credits: 100,
  },
};

// AI Models (example definitions, expand as needed)
export const AI_MODELS = {
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4 Optimized',
    provider: 'openai',
    contextWindow: 128000,
    maxTokens: 4096,
  },
  'claude-3-opus': {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    contextWindow: 200000,
    maxTokens: 4096,
  },
  'gemini-pro': {
    id: 'gemini-pro',
    name: 'Google Gemini Pro',
    provider: 'google',
    contextWindow: 32000,
    maxTokens: 2048,
  },
  'llama-3-70b': {
    id: 'llama-3-70b',
    name: 'Llama 3 70B',
    provider: 'groq',
    contextWindow: 8192,
    maxTokens: 2048,
  },
};

// Application Routes
export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  dashboard: '/dashboard',
  playground: '/playground',
  pricing: '/pricing',
  checkout: '/checkout',
  success: '/success',
  apiKeys: '/api-keys',
  usage: '/usage',
  settings: '/settings', // Assuming you'll create a settings page
  admin: '/admin',
  invite: '/invite', // Added invite route
  docs: '/docs', // Added docs route
  blog: '/blog', // Added blog route
  about: '/about', // Added about route
  features: '/features', // Added features route
  contact: '/contact', // Added contact route
  privacy: '/privacy', // Added privacy policy route
  terms: '/terms', // Added terms of service route
  changelog: '/changelog', // Added changelog route
  faq: '/faq', // Added FAQ route
};

// Feature Flags (control features via environment variables)
export const FEATURES = {
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enablePWA: process.env.NEXT_PUBLIC_ENABLE_PWA === 'true',
  useEmulator: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true',
};
