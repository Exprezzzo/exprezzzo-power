import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config({ path: '.env.local' }); // Load backend specific .env.local

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [new winston.transports.Console()]
});

let app: admin.app.App | null = null;
let isInitialized = false;

export function initializeFirebase(): boolean {
  if (isInitialized) {
    logger.debug('Firebase Admin SDK already initialized.');
    return app !== null; // Return true if app is initialized, false if it's mock
  }

  try {
    // Validate environment variables
    const required = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      logger.warn(`⚠️  Missing Firebase Admin SDK credentials: ${missing.join(', ')}. Running in mock mode.`);
      isInitialized = true; // Mark as initialized to prevent re-attempts
      app = null; // Ensure app is null for mock mode
      return false; // Indicate Firebase is NOT fully available
    }

    // Initialize Firebase Admin
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'), // CRITICAL: Replace escaped newlines
      }),
    });

    isInitialized = true;
    logger.info('✅ Firebase Admin SDK initialized successfully');
    return true; // Indicate Firebase is fully available

  } catch (error: any) {
    logger.error('❌ Firebase Admin SDK initialization failed:', error.message, error);
    isInitialized = true;
    app = null; // Ensure app is null on failure
    return false; // Indicate Firebase is NOT fully available
  }
}

// Initialize on module load, but allow for mock mode
initializeFirebase(); // This will run once when the module is imported

// Helper to check if we're using real Firebase
export const isFirebaseAvailable = () => app !== null;

// Auth wrapper with error handling and mock behavior
export const auth = {
  verifyIdToken: async (token: string) => {
    if (!app) {
      logger.warn('Firebase Admin SDK not initialized, returning mock token verification response.');
      // Simulate a decoded token for mock mode
      return { uid: 'mock-user-id', email: 'test@example.com', email_verified: true, firebase: { identities: {}, sign_in_provider: 'mock' } } as admin.auth.DecodedIdToken;
    }

    try {
      return await admin.auth().verifyIdToken(token);
    } catch (error: any) {
      logger.error('Firebase Admin: Token verification failed:', error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  },

  createCustomToken: async (uid: string, claims?: object) => {
    if (!app) {
      logger.warn('Firebase Admin SDK not initialized, returning mock custom token.');
      return 'mock-custom-token-' + uid;
    }

    try {
      return await admin.auth().createCustomToken(uid, claims);
    } catch (error: any) {
      logger.error('Firebase Admin: Custom token creation failed:', error.message);
      throw new Error('Failed to create authentication token');
    }
  },

  getUser: async (uid: string) => {
    if (!app) {
      logger.warn('Firebase Admin SDK not initialized, returning mock user.');
      return { uid, email: 'mock@example.com', emailVerified: true, displayName: 'Mock User' } as admin.auth.UserRecord;
    }

    try {
      return await admin.auth().getUser(uid);
    } catch (error: any) {
      logger.error('Firebase Admin: Get user failed:', error.message);
      throw new Error('User not found');
    }
  }
};

// Firestore wrapper with error handling and mock behavior
export const db = {
  collection: (name: string) => {
    if (!app) {
      logger.debug(`Mock Firestore collection: ${name}`);
      return createMockCollection(name);
    }
    return admin.firestore().collection(name);
  },

  batch: () => {
    if (!app) {
      logger.debug('Mock Firestore batch.');
      return createMockBatch();
    }
    return admin.firestore().batch();
  },

  runTransaction: async (updateFunction: any) => {
    if (!app) {
      logger.debug('Mock Firestore transaction.');
      return updateFunction(createMockTransaction());
    }
    return admin.firestore().runTransaction(updateFunction);
  }
};

// Mock implementations for development/missing Firebase Admin SDK
function createMockCollection(name: string) {
  logger.warn(`Mock mode: Accessing collection "${name}". Operations will be logged but not persisted.`);
  return {
    doc: (id: string) => ({
      get: async () => {
        logger.debug(`Mock get doc "${name}/${id}"`);
        return { exists: false, id, data: () => null, ref: { id, path: `${name}/${id}` } };
      },
      set: async (data: any, options?: any) => {
        logger.debug(`Mock set doc "${name}/${id}":`, data);
        return { writeTime: new Date() };
      },
      update: async (data: any) => {
        logger.debug(`Mock update doc "${name}/${id}":`, data);
        return { writeTime: new Date() };
      },
      delete: async () => {
        logger.debug(`Mock delete doc "${name}/${id}"`);
        return { writeTime: new Date() };
      }
    }),
    add: async (data: any) => {
      const id = 'mock-' + Date.now();
      logger.debug(`Mock add to collection "${name}":`, data);
      return { id, path: `${name}/${id}` };
    },
    where: (field: string, op: any, value: any) => {
      logger.debug(`Mock where on collection "${name}": ${field} ${op} ${value}`);
      return {
        get: async () => ({
          empty: true,
          size: 0,
          docs: [],
          forEach: (callback: any) => {}
        })
      };
    }
  };
}

function createMockBatch() {
  const operations: any[] = [];
  logger.warn('Mock mode: Using Firestore batch. Operations will be logged but not persisted.');
  return {
    set: (ref: any, data: any) => operations.push({ type: 'set', ref: ref.path, data }),
    update: (ref: any, data: any) => operations.push({ type: 'update', ref: ref.path, data }),
    delete: (ref: any) => operations.push({ type: 'delete', ref: ref.path }),
    commit: async () => {
      logger.debug('Mock batch commit:', operations);
      return { writeResults: operations.map(() => ({ writeTime: new Date() })) };
    }
  };
}

function createMockTransaction() {
  logger.warn('Mock mode: Using Firestore transaction. Operations will be logged but not persisted.');
  return {
    get: async (ref: any) => ({
      exists: false,
      data: () => null,
      ref: { path: ref.path }
    }),
    set: (ref: any, data: any) => logger.debug('Mock transaction set:', ref.path, data),
    update: (ref: any, data: any) => logger.debug('Mock transaction update:', ref.path, data),
    delete: (ref: any) => logger.debug('Mock transaction delete:', ref.path)
  };
}
