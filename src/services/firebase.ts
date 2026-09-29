// =============================================
// EVI - Firebase Configuration
// Project: evi-house-manager
// Console: https://console.firebase.google.com/project/evi-house-manager
// =============================================

import { initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyByT9j-J6HVBV2O2c5wQRyxfUcC-ssJX6Q',
  authDomain: 'evi-house-manager.firebaseapp.com',
  projectId: 'evi-house-manager',
  storageBucket: 'evi-house-manager.firebasestorage.app',
  messagingSenderId: '874771790659',
  appId: '1:874771790659:web:79919d13456a59b9d84df6',
  measurementId: 'G-GR6GY1BG0M',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
let auth: Auth;
try {
  auth = initializeAuth(app);
} catch (e) {
  // Auth already initialized
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
// NOTE: Storage requires the Blaze (pay-as-you-go) plan on Firebase.
// Upgrade at: https://console.firebase.google.com/project/evi-house-manager/usage/details
// Document upload features will fail until Storage is enabled on Blaze.
const storage = getStorage(app);

export { app, auth, db, storage };
export default app;
