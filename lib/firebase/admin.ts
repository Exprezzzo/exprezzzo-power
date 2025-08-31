import { initializeApp, cert, getApps, getApp, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Lazy initialization function
let adminApp: any = null;
let adminAuth: any = null;
let adminDb: any = null;

const initializeAdmin = () => {
  if (adminApp) return { adminApp, adminAuth, adminDb };
  
  try {
    // Check if running in Vercel/production
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
      console.warn('Firebase Admin SDK not configured - missing environment variables');
      return { adminApp: null, adminAuth: null, adminDb: null };
    }
    
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '',
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    };
    
    // Initialize admin app
    adminApp = getApps().length === 0 
      ? initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID
        })
      : getApp();
    
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    
    console.log('Firebase Admin SDK initialized successfully');
    return { adminApp, adminAuth, adminDb };
    
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    return { adminApp: null, adminAuth: null, adminDb: null };
  }
};

// Export lazy-loaded instances
export const getAdminAuth = () => {
  const { adminAuth } = initializeAdmin();
  return adminAuth;
};

export const getAdminDb = () => {
  const { adminDb } = initializeAdmin();
  return adminDb;
};

export const getAdminApp = () => {
  const { adminApp } = initializeAdmin();
  return adminApp;
};

// Export FieldValue for Firestore operations
export { FieldValue };

// Helper function to verify ID tokens
export const verifyIdToken = async (token: string) => {
  try {
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      throw new Error('Firebase Admin not initialized');
    }
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
};

// Helper to check if admin is configured
export const isAdminConfigured = () => {
  return !!process.env.FIREBASE_ADMIN_PROJECT_ID;
};