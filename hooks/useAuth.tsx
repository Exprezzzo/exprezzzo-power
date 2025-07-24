// hooks/useAuth.tsx
// Corrected: Renamed from .ts to .tsx to allow JSX.
// Enhanced: Includes full Firebase Auth methods (signIn, signUp, Google, etc.).

'use client'; // This directive is necessary for client-side hooks and JSX in App Router.

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail, // For password reset (not magic link)
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Import client-side Firebase auth instance.

// Define the shape of our authentication context
interface AuthContextType {
  user: User | null; // Firebase User object
  loading: boolean; // True while checking auth state
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  // Add isPro here later if needed directly in context from user profile
}

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider Component: Wraps your app to provide auth context
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    signInWithGoogle,
    resetPassword
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to easily consume the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}