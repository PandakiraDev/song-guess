import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration
// TODO: Replace with your own Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyBLmqXNASLm12qfezmwn-CrHLKYxyG3sTU",
  authDomain: "songguess-4dd30.firebaseapp.com",
  projectId: "songguess-4dd30",
  storageBucket: "songguess-4dd30.appspot.com",
  messagingSenderId: "907750033094",
  appId: "1:907750033094:web:9689619661915b6d27f9c7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
let auth;
if (Platform.OS !== 'web') {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
