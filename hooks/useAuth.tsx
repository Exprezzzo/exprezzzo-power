// hooks/useAuth.tsx
'use client';

import { useState, useEffect, useContext, createContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, getFirestore } from 'firebase/firestore'; // Import Firestore functions
import { auth, firebaseApp } from '@/lib/firebase'; // Ensure firebaseApp is exported from lib/firebase

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
        // If user is authenticated, set up a Firestore listener for their profile
        const db = getFirestore(firebaseApp);
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