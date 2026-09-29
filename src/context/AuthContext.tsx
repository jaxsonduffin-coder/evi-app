// =============================================
// EVI - Auth Context Provider
// =============================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange, getUserProfile } from '../services/authService';
import { User, Household } from '../types';
import { getHousehold } from '../services/householdService';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: User | null;
  currentHousehold: Household | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  setCurrentHousehold: (household: Household | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  currentHousehold: null,
  loading: true,
  refreshProfile: async () => {},
  setCurrentHousehold: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setFirebaseUser(user);

      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);

          // Load current household in parallel (don't block on this)
          if (profile?.currentHouseholdId) {
            getHousehold(profile.currentHouseholdId)
              .then(setCurrentHousehold)
              .catch((e) => console.warn('Household load error:', e));
          }

          // Register for push notifications in the background
          (async () => {
            try {
              const { registerForPushNotifications } = await import('../services/notificationService');
              await registerForPushNotifications(user.uid);
            } catch (e) {
              console.warn('Push registration failed:', e);
            }
          })();
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      } else {
        setUserProfile(null);
        setCurrentHousehold(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    const profile = await getUserProfile(firebaseUser.uid);
    setUserProfile(profile);

    if (profile?.currentHouseholdId) {
      const household = await getHousehold(profile.currentHouseholdId);
      setCurrentHousehold(household);
    }
  }, [firebaseUser]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        currentHousehold,
        loading,
        refreshProfile,
        setCurrentHousehold,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
