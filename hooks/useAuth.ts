// hooks/useAuth.ts
// React hook for managing user authentication state and profile.

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { onAuthChange, getUserProfile, UserProfile } from '@/lib/auth';
import { User } from 'firebase/auth'; // Firebase User type

// Define the shape of our authentication context
interface AuthContextType {
  user: User | null; // Firebase User object
  userProfile: UserProfile | null; // Our custom user profile from Firestore
  isLoading: boolean; // True while checking auth state
  isPro: boolean; // True if user has "Power Access"
}

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider Component: Wraps your app to provide auth context
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user profile from Firestore to get isPro status
        const profile = await getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
        setIsPro(profile?.isPro || false);
      } else {
        setUser(null);
        setUserProfile(null);
        setIsPro(false);
      }
      setIsLoading(false); // Done loading auth state
    });

    // Clean up subscription on component unmount
    return () => unsubscribe();
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    user,
    userProfile,
    isLoading,
    isPro,
  }), [user, userProfile, isLoading, isPro]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily consume the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};