// hooks/useAuth.tsx
'use client';

import { useState, useEffect, useContext, createContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getApps, getApp, initializeApp } from 'firebase/app'; // Correct import for getApps and getApp
import { doc, onSnapshot, getFirestore } from 'firebase/firestore'; // Correct import for getFirestore
import { auth, firebaseConfig } from '@/lib/firebase'; // Assuming firebaseConfig is exported, or modify as needed

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
        let appInstance;
        // Ensure the Firebase app is initialized, if not already.
        // This relies on `auth` being initialized which should also initialize the app.
        if (!getApps().length) {
          // Fallback if app is somehow not initialized, but typically auth import initializes it.
          // You might need to import `initializeApp` from 'firebase/app' and call it here.
          // For now, assume it's initialized by '@/lib/firebase'.
          console.error("Firebase app not initialized when useAuth started. This is unexpected.");
          setLoading(false);
          setUser(null);
          return;
        }
        appInstance = getApp(); // Get the default initialized app

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
            // import { setDoc } from 'firebase/firestore';
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