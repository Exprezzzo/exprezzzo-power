// lib/firebase.ts
// Client-side Firebase SDK initialization (browser context).

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Add other Firebase services as you use them, e.g., getStorage, getFunctions

// Your Firebase Web App configuration.
// These MUST be set as NEXT_PUBLIC_ variables in your .env.local and Vercel Dashboard.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app only once.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Firebase services instances
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const storage = getStorage(app);
// export const functions = getFunctions(app);

// Optional: Connect to Firebase Emulators for local development
if (process.env.NODE_ENV === 'development') {
  // Check if we are running in a browser environment before attempting to connect emulators
  // 'connectAuthEmulator' is only available in Firebase JS SDK (client-side)
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
    try {
      // Ensure emulators are running locally, e.g., 'firebase emulators:start'
      // And configure your .env.local with these URLs
      if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST) {
        console.log('Connecting to Auth emulator:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST);
        getAuth(app).useEmulator(`http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`);
      }
      if (process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST) {
        console.log('Connecting to Firestore emulator:', process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST);
        getFirestore(app).useEmulator(process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST);
      }
      // Add other emulators as needed (e.g., Storage, Functions)
    } catch (e) {
      console.error("Failed to connect to Firebase emulators:", e);
    }
  }
}