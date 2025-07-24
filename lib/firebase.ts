// lib/firebase.ts - Client-side Firebase configuration
// Corrected: Includes Analytics and isSupported check for client-side.

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Assuming storage is used
import { getAnalytics, isSupported } from 'firebase/analytics'; // For Analytics

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Make sure this is in .env.local and Vercel ENV
};

// Initialize Firebase app only once.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // Export storage if needed

// Analytics (client-side only and only if supported by browser)
export const analytics = typeof window !== 'undefined' ?
  isSupported().then(yes => yes ? getAnalytics(app) : null).catch(e => { console.error("Analytics not supported or init error:", e); return null; }) :
  null; // Ensure this is only on client and handles promise/errors

export default app;