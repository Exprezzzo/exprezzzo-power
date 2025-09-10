import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };

  initializeApp({
    credential: cert(serviceAccount as any),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

// Session cookie management
export async function createSessionCookie(idToken: string, expiresIn: number = 5 * 24 * 60 * 60 * 1000) {
  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    return { sessionCookie, success: true };
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return { success: false, error: 'Failed to create session' };
  }
}

export async function verifySessionCookie(sessionCookie: string) {
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { decodedClaims, success: true };
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return { success: false, error: 'Invalid session' };
  }
}

// User management
export async function setAdminRole(uid: string, isAdmin: boolean = true) {
  try {
    await adminAuth.setCustomUserClaims(uid, { admin: isAdmin });
    return { success: true };
  } catch (error) {
    console.error('Error setting admin role:', error);
    return { success: false, error: 'Failed to set admin role' };
  }
}

// Cost tracking and margin enforcement
export interface UserMetrics {
  uid: string;
  totalCost: number;
  subscriptionValue: number;
  margin: number;
  apiCalls: number;
  lastUpdated: Date;
}

export async function getUserMetrics(uid: string): Promise<UserMetrics | null> {
  try {
    const doc = await adminDb.collection('metrics').doc(uid).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as UserMetrics;
  } catch (error) {
    console.error('Error getting user metrics:', error);
    return null;
  }
}

export async function updateUserCost(uid: string, cost: number, subscriptionValue: number) {
  try {
    const metricsRef = adminDb.collection('metrics').doc(uid);
    const doc = await metricsRef.get();

    if (!doc.exists) {
      // Create new metrics document
      const newMetrics: UserMetrics = {
        uid,
        totalCost: cost,
        subscriptionValue,
        margin: ((subscriptionValue - cost) / subscriptionValue) * 100,
        apiCalls: 1,
        lastUpdated: new Date(),
      };
      await metricsRef.set(newMetrics);
      return { success: true, metrics: newMetrics };
    } else {
      // Update existing metrics
      const currentMetrics = doc.data() as UserMetrics;
      const newTotalCost = currentMetrics.totalCost + cost;
      const newMargin = ((subscriptionValue - newTotalCost) / subscriptionValue) * 100;
      
      const updatedMetrics: UserMetrics = {
        ...currentMetrics,
        totalCost: newTotalCost,
        subscriptionValue,
        margin: newMargin,
        apiCalls: currentMetrics.apiCalls + 1,
        lastUpdated: new Date(),
      };
      
      await metricsRef.update(updatedMetrics);
      return { success: true, metrics: updatedMetrics };
    }
  } catch (error) {
    console.error('Error updating user cost:', error);
    return { success: false, error: 'Failed to update user cost' };
  }
}

export async function checkMarginThreshold(uid: string, minMargin: number = 50): Promise<boolean> {
  try {
    const metrics = await getUserMetrics(uid);
    if (!metrics) {
      return true; // Allow if no metrics exist yet
    }
    
    return metrics.margin >= minMargin;
  } catch (error) {
    console.error('Error checking margin threshold:', error);
    return false; // Block on error for safety
  }
}

// Subscription management
export interface SubscriptionInfo {
  plan: 'monthly' | 'yearly';
  value: number;
  status: 'active' | 'cancelled' | 'past_due';
  stripeSubscriptionId?: string;
}

export async function getSubscriptionInfo(uid: string): Promise<SubscriptionInfo | null> {
  try {
    const doc = await adminDb.collection('subscriptions').doc(uid).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as SubscriptionInfo;
  } catch (error) {
    console.error('Error getting subscription info:', error);
    return null;
  }
}

// Referral management
export interface ReferralData {
  code: string;
  referrerId: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export async function generateReferralCode(uid: string): Promise<string> {
  const code = `POWER-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  try {
    await adminDb.collection('referrals').doc(uid).set({
      code,
      referrerId: uid,
      totalReferrals: 0,
      activeReferrals: 0,
      totalEarnings: 0,
      pendingEarnings: 0,
      createdAt: new Date(),
    });
    
    return code;
  } catch (error) {
    console.error('Error generating referral code:', error);
    throw new Error('Failed to generate referral code');
  }
}

export async function processReferral(referralCode: string, newUserId: string, subscriptionValue: number) {
  try {
    const referralQuery = await adminDb.collection('referrals').where('code', '==', referralCode).get();
    
    if (referralQuery.empty) {
      return { success: false, error: 'Invalid referral code' };
    }

    const referralDoc = referralQuery.docs[0];
    const referralData = referralDoc.data() as ReferralData;
    
    // Calculate commission (20%)
    const commission = subscriptionValue * 0.2;
    
    // Update referrer's earnings
    await referralDoc.ref.update({
      totalReferrals: referralData.totalReferrals + 1,
      activeReferrals: referralData.activeReferrals + 1,
      pendingEarnings: referralData.pendingEarnings + commission,
    });

    // Track the referral relationship
    await adminDb.collection('referral_relationships').add({
      referrerId: referralData.referrerId,
      referredUserId: newUserId,
      referralCode,
      commission,
      status: 'active',
      createdAt: new Date(),
    });

    return { success: true, commission };
  } catch (error) {
    console.error('Error processing referral:', error);
    return { success: false, error: 'Failed to process referral' };
  }
}