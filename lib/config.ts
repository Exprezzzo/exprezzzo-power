export const config = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
  FIREBASE_CONFIG: process.env.NEXT_PUBLIC_FIREBASE_CONFIG ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG) : {}
};
