// lib/auth.ts - Enhanced authentication utilities
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  AuthError // Import AuthError type
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; // Import serverTimestamp
import { auth, db } from './firebase'; // Your client-side Firebase auth and db instances

// Enhanced user profile interface
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified: boolean; // Add emailVerified
  isPro: boolean;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete' | 'incomplete_expired'; // Add more statuses
  plan?: 'free' | 'monthly' | 'yearly';
  creditsUsed?: number;
  creditsLimit?: number;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  lastLogin?: any; // Firestore Timestamp
  referralCode?: string;
  referredBy?: string;
}

// Error messages mapping
const AUTH_ERROR_MESSAGES: { [key: string]: string } = {
  'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
  'auth/weak-password': 'Password should be at least 6 characters long.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-not-found': 'No account found with this email. Please sign up first.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled (check Firebase config).',
  'auth/invalid-credential': 'The credential is invalid or has expired.',
  'auth/user-disabled': 'Your account has been disabled. Please contact support.',
  'auth/email-not-verified': 'Please verify your email address to continue.'
};

// Helper to get user-friendly error messages
export const getAuthErrorMessage = (error: AuthError): string => {
  return AUTH_ERROR_MESSAGES[error.code] || error.message || 'An unexpected authentication error occurred.';
};

// Email/Password Authentication
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await updateLastLogin(user.uid);
    return user;
  } catch (error) {
    throw error as AuthError;
  }
};

export const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // Update display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Send email verification
    await sendEmailVerification(user); // Important for security

    // Create user profile in Firestore
    await createUserProfile(user); // Calls function below

    return user;
  } catch (error) {
    throw error as AuthError;
  }
};

// Google Sign In (example)
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async (): Promise<User> => {
  try {
    const { user } = await signInWithPopup(auth, googleProvider);

    // Check if new user and create profile
    const profile = await getUserProfile(user.uid);
    if (!profile) {
      await createUserProfile(user);
    } else {
      await updateLastLogin(user.uid);
    }

    return user;
  } catch (error) {
    // Fallback to redirect if popup blocked, especially on mobile
    if ((error as AuthError).code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, googleProvider);
    }
    throw error as AuthError;
  }
};

// Handle redirect result (for cases like Google Sign In with redirect)
export const handleRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      const profile = await getUserProfile(result.user.uid);
      if (!profile) {
        await createUserProfile(result.user);
      } else {
        await updateLastLogin(result.user.uid);
      }
      return result.user;
    }
    return null;
  } catch (error) {
    throw error as AuthError;
  }
};

// Password Reset
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/login`, // Redirect back to login page
      handleCodeInApp: false, // Use out-of-band email flow
    });
  } catch (error) {
    throw error as AuthError;
  }
};

// Magic Link Authentication (example)
const actionCodeSettings = {
  url: `${window.location.origin}/auth/verify`, // A page you'd set up to handle the link
  handleCodeInApp: true,
};

export const sendMagicLink = async (email: string): Promise<void> => {
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem('emailForSignIn', email); // Store email for sign-in confirmation
  } catch (error) {
    throw error as AuthError;
  }
};

export const completeMagicLinkSignIn = async (email: string, url: string): Promise<User> => {
  try {
    if (!isSignInWithEmailLink(auth, url)) {
      throw new Error('Invalid sign-in link or email mismatch.');
    }

    const { user } = await signInWithEmailLink(auth, email, url);
    localStorage.removeItem('emailForSignIn');

    // Check if new user
    const profile = await getUserProfile(user.uid);
    if (!profile) {
      await createUserProfile(user);
    } else {
      await updateLastLogin(user.uid);
    }

    return user;
  } catch (error) {
    throw error as AuthError;
  }
};

// Sign Out
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error as AuthError;
  }
};

// User Profile Management in Firestore (client-side)
export const createUserProfile = async (user: User): Promise<void> => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userProfile: Partial<UserProfile> = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      isPro: false, // Default to false
      plan: 'free', // Default plan
      creditsUsed: 0,
      creditsLimit: 100, // Free tier limit
      createdAt: serverTimestamp(), // Use Firestore server timestamp
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      referralCode: generateReferralCode(user.uid),
    };

    await setDoc(userRef, userProfile, { merge: true });
  } catch (error) {
    console.error('Error creating user profile in Firestore:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { uid, email: userSnap.data()?.email, emailVerified: userSnap.data()?.emailVerified || false, ...userSnap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile from Firestore:', error);
    return null;
  }
};

export const updateLastLogin = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating last login in Firestore:', error);
  }
};

// Helper to generate referral code
const generateReferralCode = (uid: string): string => {
  return `REF${uid.substring(0, 6).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
};

// Auth State Observer (for useAuth hook)
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user (client-side)
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Check if user email is verified
export const isEmailVerified = (): boolean => {
  return auth.currentUser?.emailVerified || false;
};

// Resend verification email
export const resendVerificationEmail = async (): Promise<void> => {
  if (auth.currentUser && !auth.currentUser.emailVerified) {
    await sendEmailVerification(auth.currentUser);
    console.log('Verification email sent!');
  } else {
    console.warn('Cannot send verification email: no user or email already verified.');
  }
};
