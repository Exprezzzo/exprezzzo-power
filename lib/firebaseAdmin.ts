// lib/firebaseAdmin.ts
// Updated: Now explicitly exports the 'admin' namespace for FieldValue access.

import "server-only"; // Ensures this module is never bundled client-side.

import * as admin from 'firebase-admin'; // Keep this import

// A simple mock for Firebase Admin services during Vercel build.
const mockFirestore = {
  collection: () => ({
    doc: () => ({
      set: async () => console.log("[Firebase Mock] Firestore set called (build-time mock)"),
      update: async () => console.log("[Firebase Mock] Firestore update called (build-time mock)"),
      get: async () => ({ exists: false, data: () => ({}) }),
    }),
    where: () => mockFirestore.collection(),
    limit: () => mockFirestore.collection(),
    get: async () => ({ empty: true, docs: [] }),
  }),
};

let initializedApp: admin.app.App | null = null;

export function getFirebaseAdminApp() {
  if (initializedApp) {
    return initializedApp;
  }

  const isVercelBuildWithoutSecrets =
    (process.env.VERCEL === '1' &&
     (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY));

  if (isVercelBuildWithoutSecrets) {
    console.warn('Firebase Admin: Detecting Vercel build environment without full credentials. Returning mock for build process.');
    return {
      firestore: () => mockFirestore,
      // Add other mocked services if needed, e.g., auth: () => mockAuth
    } as unknown as admin.app.App; // Cast to bypass TypeScript errors for runtime type
  }

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.error('Firebase Admin credentials are missing at runtime. Cannot initialize.');
      throw new Error('Firebase Admin environment variables are missing at runtime. Cannot initialize.');
  }

  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    };
    initializedApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("Firebase Admin SDK initialized successfully.");
    return initializedApp;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK (runtime error):", error);
    throw error;
  }
}

// Export Firestore and the 'admin' namespace for FieldValue access
export const db = getFirebaseAdminApp().firestore();
export { admin }; // ADD THIS LINE: Explicitly export the 'admin' namespace
// export const authAdmin = getFirebaseAdminApp().auth(); // Example: if you need Auth Admin