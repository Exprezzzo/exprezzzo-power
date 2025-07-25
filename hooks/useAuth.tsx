// hooks/useAuth.tsx
'use client';

import { useState, useEffect, useContext, createContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, getFirestore, getApps, getApp, initializeFirestore } from 'firebase/firestore'; // Added getApps, getApp, initializeFirestore
import { auth, firebaseApp as exportedFirebaseApp } from '@/lib/firebase'; // Attempt to import as exportedFirebaseApp, fallback if not explicitly exported

interface UserProfile {
  uid: string;
  email: string | null;
  isPro: boolean; // This is the crucial field
  // Add other user profile fields as needed
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  firebaseUser: FirebaseUser | null; // Keep original FirebaseUser object
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, firebaseUser: null });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authenticatedUser) => {
      setFirebaseUser(authenticatedUser);
      if (authenticatedUser) {
        // Ensure Firestore is initialized if not already
        let appInstance;
        if (getApps().length === 0) {
          // This case should ideally not happen if firebase.ts initializes the app,
          // but as a fallback, ensure the app is initialized.
          // This block might indicate an issue with firebase.ts's initialization being too late or not called.
          // Assuming firebase.ts's default export handles it implicitly for `auth`, `db` etc.
          // For explicit app instance, we rely on getApp() once initialized.
          console.error("Firebase app not initialized when useAuth started. Check lib/firebase.ts initialization.");
          setLoading(false);
          setUser(null);
          return;
        } else {
          appInstance = getApp(); // Get the default initialized app
        }

        const db = getFirestore(appInstance); // Use the retrieved app instance
        const userDocRef = doc(db, 'users', authenticatedUser.uid);

        const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({
              uid: authenticatedUser.uid,
              email: authenticatedUser.email,
              isPro: userData.isPro || false, // Default to false if not set
              ...userData // Merge all other user data
            });
          } else {
            // User document doesn't exist yet, create a basic one
            setUser({
              uid: authenticatedUser.uid,
              email: authenticatedUser.email,
              isPro: false,
            });
            // Optionally, create the user document in Firestore if it doesn't exist
            // setDoc(userDocRef, { email: authenticatedUser.email, isPro: false }, { merge: true });
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user document:", error);
          setLoading(false);
          setUser(null); // Treat as no user if there's a firestore error
        });

        // Clean up Firestore listener on unmount or user change
        return () => unsubscribeFirestore();
      } else {
        // No authenticated user
        setUser(null);
        setLoading(false);
      }
    });

    // Clean up Auth state listener on unmount
    return () => unsubscribeAuth();
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <AuthContext.Provider value={{ user, loading, firebaseUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);