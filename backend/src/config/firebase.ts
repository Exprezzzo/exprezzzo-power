import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

let isInitialized = false;

export function initializeFirebase() {
  if (!isInitialized && admin.apps.length === 0) {
    try {
      // Check if we have the required environment variables
      if (!process.env.FIREBASE_PROJECT_ID || 
          !process.env.FIREBASE_CLIENT_EMAIL || 
          !process.env.FIREBASE_PRIVATE_KEY) {
        console.log('⚠️  Firebase credentials not found in .env.local');
        console.log('📝 Using mock Firebase for development');
        // Don't initialize Firebase Admin, just set the flag
        isInitialized = true;
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      isInitialized = true;
      console.log('✅ Firebase Admin initialized');
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      isInitialized = true; // Prevent repeated attempts
    }
  }
}

// Initialize on import
initializeFirebase();

// Lazy getters that check initialization
export const auth = {
  verifyIdToken: async (token: string) => {
    if (!isInitialized || admin.apps.length === 0) {
      console.log('⚠️  Firebase not initialized, returning mock response');
      return { uid: 'mock-user', email: 'test@example.com' };
    }
    return admin.auth().verifyIdToken(token);
  },
  createCustomToken: async (uid: string) => {
    if (!isInitialized || admin.apps.length === 0) {
      return 'mock-custom-token';
    }
    return admin.auth().createCustomToken(uid);
  }
};

export const db = {
  collection: (name: string) => {
    if (!isInitialized || admin.apps.length === 0) {
      // Return mock Firestore for development
      return {
        doc: (id: string) => ({
          get: async () => ({ exists: false, data: () => null }),
          set: async (data: any) => { console.log('Mock set:', data); }
        }),
        add: async (data: any) => { console.log('Mock add:', data); }
      };
    }
    return admin.firestore().collection(name);
  }
};