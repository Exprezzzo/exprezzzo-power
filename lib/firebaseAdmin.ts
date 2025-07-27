// lib/firebaseAdmin.ts - Enhanced server-side Firebase Admin
// Implements Phoenix v3.4 Fixes:
// - Production-Ready Admin SDK Initialization
// - Mock mode for development/missing credentials

import * as admin from 'firebase-admin';
import { getApps, getApp, cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Type for our admin app instance
type AdminApp = admin.app.App | null;

let adminApp: AdminApp = null;
let adminAuth: admin.auth.Auth | null = null;
let adminDb: Firestore | null = null;

// Initialize Firebase Admin with proper error handling
const initializeAdmin = (): boolean => {
  // Skip if already initialized
  if (getApps().length > 0) {
    adminApp = getApp(); // Get existing app
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    return true;
  }

  try {
    // Check for required environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Firebase Admin: Missing credentials for development, running in mock mode. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
        return false; // Indicate Firebase is NOT fully available for real operations
      }
      throw new Error('Missing Firebase Admin credentials in production. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
    }

    // Create service account
    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'), // CRITICAL: Replace escaped newlines for Vercel
    };

    // Initialize app
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      // databaseURL: `https://${projectId}.firebaseio.com`, // Optional: Add if using Realtime Database
    });

    // Initialize services
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);

    // Configure Firestore settings
    adminDb.settings({
      ignoreUndefinedProperties: true,
    });

    console.log('✅ Firebase Admin initialized successfully');
    return true;

  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error; // Re-throw to fail build/deployment in production
    }
    return false;
  }
};

// Lazy initialization wrapper
const ensureInitialized = () => {
  if (!adminApp && getApps().length === 0) { // Only attempt to initialize if no app exists globally
    const success = initializeAdmin();
    if (!success && process.env.NODE_ENV === 'production') {
      throw new Error('Firebase Admin SDK initialization failed in production and could not recover.');
    }
  } else if (getApps().length > 0 && !adminApp) {
    // This case means an app was initialized elsewhere (e.g., in a different part of backend),
    // but our local `adminApp` ref isn't set. Get the existing app.
    adminApp = getApp();
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  }
};

// Export getters that ensure initialization before returning the service instance
export const getAdminApp = (): AdminApp => {
  ensureInitialized();
  return adminApp;
};

export const getAdminAuth = (): admin.auth.Auth => {
  ensureInitialized();
  if (!adminAuth) {
    throw new Error('Firebase Admin Auth not initialized (likely due to missing credentials or init failure).');
  }
  return adminAuth;
};

export const getAdminFirestore = (): Firestore => {
  ensureInitialized();
  if (!adminDb) {
    throw new Error('Firebase Admin Firestore not initialized (likely due to missing credentials or init failure).');
  }
  return adminDb;
};

// Export for backwards compatibility (if needed by older code)
// Be cautious: direct access to these might bypass the ensureInitialized() check in some contexts.
export { adminApp, adminAuth, adminDb };
