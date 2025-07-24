// lib/auth.ts
// Frontend authentication utilities.

import { auth, db } from './firebase'; // Import client-side Firebase instances
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendSignInLinkToEmail, // For Magic Link
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Interface for a user profile, matching Firestore
export interface UserProfile {
  uid: string;
  email: string;
  isPro: boolean;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  plan?: string;
  // Add other user profile fields here
}

// --- Basic Email/Password Authentication (if needed) ---
export const signIn = async (email: string, password: string) => {
  await signInWithEmailAndPassword(auth, email, password);
};

export const signUp = async (email: string, password: string) => {
  await createUserWithEmailAndPassword(auth, email, password);
};

export const logOut = async () => {
  await signOut(auth);
};

// --- Magic Link Authentication (as per blueprint) ---
const actionCodeSettings = {
  url: `${window.location.origin}/auth/verify`, // Redirect to /auth/verify after clicking email link
  handleCodeInApp: true,
};

export const sendMagicLink = async (email: string) => {
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  localStorage.setItem('emailForSignIn', email); // Save email for verification on redirect
};

export const completeMagicLinkSignIn = async (email: string, url: string) => {
  if (isSignInWithEmailLink(auth, url)) {
    await signInWithEmailLink(auth, email, url);
    localStorage.removeItem('emailForSignIn');
  }
};

// --- User Profile Fetching (to check isPro status) ---
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return { uid, ...userDocSnap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Observer for user authentication state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};