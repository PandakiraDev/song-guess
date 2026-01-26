import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Firebase configuration for Firestore (web SDK)
const firebaseConfig = {
  apiKey: "AIzaSyBLmqXNASLm12qfezmwn-CrHLKYxyG3sTU",
  authDomain: "songguess-4dd30.firebaseapp.com",
  projectId: "songguess-4dd30",
  storageBucket: "songguess-4dd30.appspot.com",
  messagingSenderId: "907750033094",
  appId: "1:907750033094:web:9689619661915b6d27f9c7"
};

// Initialize Firebase app for Firestore (web SDK)
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore (web SDK - works fine)
export const db: Firestore = getFirestore(app);

// Initialize Firebase Storage (web SDK)
export const storage: FirebaseStorage = getStorage(app);

// Export native Firebase Auth module
export const firebaseAuth = auth;

// Helper to get current auth instance
export const getFirebaseAuth = () => auth();

// Helper for Firestore
export const getFirebaseDb = (): Firestore => db;

// Helper for Storage
export const getFirebaseStorage = (): FirebaseStorage => storage;

// Re-export auth types for convenience
export type { FirebaseAuthTypes };
