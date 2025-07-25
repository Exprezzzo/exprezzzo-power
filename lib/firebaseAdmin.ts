// lib/firebaseAdmin.ts
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// CRITICAL: Lazy initialization prevents Vercel build failures
let adminApp;

export const getAdminApp = () => {
  if (!getApps().length) {
    // Check if on Vercel and secrets are not fully configured to prevent build errors
    const isVercelBuildWithoutSecrets =
      (process.env.VERCEL === '1' && !process.env.FIREBASE_PRIVATE_KEY);

    if (isVercelBuildWithoutSecrets) {
      console.warn("Firebase Admin SDK skipped initialization in Vercel build environment due to missing secrets.");
      // Return a mock or throw if this state should be fatal, but for builds,
      // it's often best to allow it to pass if the Admin SDK isn't strictly needed at build time.
      return null; // Or return a mock object if your code expects a non-null return
    }

    try {
      const firebaseAdminConfig = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
        throw new Error("Missing Firebase Admin credentials. Check environment variables.");
      }

      adminApp = initializeApp({
        credential: cert(firebaseAdminConfig),
      });
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
      // Depending on strictness, you might re-throw or handle gracefully
      throw error;
    }
  } else {
    adminApp = getApp(); // If already initialized, get the existing app
  }
  return adminApp;
};

// You might also export getFirestore directly for convenience in API routes
export const adminFirestore = () => {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
};