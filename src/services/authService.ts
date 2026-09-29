// =============================================
// EVI - Authentication Service
// =============================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';
import { Analytics, setAnalyticsUser } from './analyticsService';

// Sign up with email/password
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update profile with display name
  await updateProfile(user, { displayName });

  // Create user document in Firestore
  const userData: Omit<User, 'createdAt'> & { createdAt: any } = {
    id: user.uid,
    email: email.toLowerCase(),
    displayName,
    householdIds: [],
    subscriptionTier: 'free',
    onboardingComplete: false,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', user.uid), userData);

  setAnalyticsUser(user.uid);
  Analytics.signUp('email');

  return user;
}

// Sign in with email/password
export async function signIn(
  email: string,
  password: string
): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  setAnalyticsUser(userCredential.user.uid);
  Analytics.login('email');
  return userCredential.user;
}

// Sign out
export async function logOut(): Promise<void> {
  // Clear cache before signing out so user data doesn't leak across accounts
  const { clearCache } = await import('../hooks/useCache');
  clearCache();
  setAnalyticsUser(null);
  await signOut(auth);
}

// Reset password
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Get user profile from Firestore
export async function getUserProfile(userId: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    return userDoc.data() as User;
  }
  return null;
}

// Update the current user's display name (Firebase Auth profile + Firestore doc)
export async function updateUserDisplayName(displayName: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  const trimmed = displayName.trim();
  if (!trimmed) throw new Error('Name cannot be empty');

  await updateProfile(user, { displayName: trimmed });
  await updateDoc(doc(db, 'users', user.uid), { displayName: trimmed });
}

// Listen to auth state changes
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
) {
  return onAuthStateChanged(auth, callback);
}
