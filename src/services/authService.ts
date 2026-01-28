import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { db } from './firebase';
import { User, GuestUser, AVATARS } from '../types';

// Generate a random guest ID
export const generateGuestId = (): string => {
  return 'guest_' + Math.random().toString(36).substring(2, 15);
};

// Generate a random avatar
export const getRandomAvatar = (): string => {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
};

// Create a guest user (no Firebase Auth)
export const createGuestUser = (displayName: string): GuestUser => {
  return {
    id: generateGuestId(),
    displayName,
    avatar: getRandomAvatar(),
    isGuest: true,
  };
};

// Sign up with email/password
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  const userCredential = await auth().createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;

  // Update display name
  await user.updateProfile({ displayName });

  // Create user document in Firestore
  const userData: Omit<User, 'id'> = {
    displayName,
    email,
    avatar: getRandomAvatar(),
    isGuest: false,
    gamesPlayed: 0,
    totalWins: 0,
    totalPoints: 0,
    totalCorrectGuesses: 0,
    totalGuesses: 0,
    totalResponseTimeMs: 0,
    totalResponseCount: 0,
    fastestCorrectMs: 0,
    bestStreak: 0,
    createdAt: serverTimestamp() as any,
  };

  await setDoc(doc(db, 'users', user.uid), userData);

  return {
    id: user.uid,
    ...userData,
  };
};

// Sign in with email/password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User | null> => {
  const userCredential = await auth().signInWithEmailAndPassword(email, password);
  return getUserData(userCredential.user.uid);
};

// Sign in with Google
export const signInWithGoogle = async (idToken: string): Promise<User | null> => {
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);
  const userCredential = await auth().signInWithCredential(googleCredential);
  const user = userCredential.user;

  // Check if user document exists
  const userDoc = await getDoc(doc(db, 'users', user.uid));

  if (!userDoc.exists()) {
    // Create new user document
    const userData: Omit<User, 'id'> = {
      displayName: user.displayName || 'Player',
      email: user.email || undefined,
      avatar: getRandomAvatar(),
      isGuest: false,
      gamesPlayed: 0,
      totalWins: 0,
      totalPoints: 0,
      totalCorrectGuesses: 0,
      totalGuesses: 0,
      totalResponseTimeMs: 0,
      totalResponseCount: 0,
      fastestCorrectMs: 0,
      bestStreak: 0,
      createdAt: serverTimestamp() as any,
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    return {
      id: user.uid,
      ...userData,
    };
  }

  return getUserData(user.uid);
};

// Sign out
export const signOut = async (): Promise<void> => {
  await auth().signOut();
};

// Get user data from Firestore
export const getUserData = async (userId: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, 'users', userId));

  if (!userDoc.exists()) {
    return null;
  }

  return {
    id: userId,
    ...userDoc.data(),
  } as User;
};

// Game stats passed from ResultsScreen after a game
export interface GameStatsUpdate {
  won: boolean;
  points: number;
  correctGuesses: number;
  totalGuesses: number;
  totalResponseTimeMs: number;
  responseCount: number;
  fastestCorrectMs: number;
  bestStreak: number;
}

// Update user stats after game
export const updateUserStats = async (
  userId: string,
  stats: GameStatsUpdate
): Promise<void> => {
  const userDoc = await getDoc(doc(db, 'users', userId));

  if (!userDoc.exists()) {
    return;
  }

  const d = userDoc.data() as User;

  await setDoc(
    doc(db, 'users', userId),
    {
      gamesPlayed: (d.gamesPlayed || 0) + 1,
      totalWins: (d.totalWins || 0) + (stats.won ? 1 : 0),
      totalPoints: (d.totalPoints || 0) + stats.points,
      totalCorrectGuesses: (d.totalCorrectGuesses || 0) + stats.correctGuesses,
      totalGuesses: (d.totalGuesses || 0) + stats.totalGuesses,
      totalResponseTimeMs: (d.totalResponseTimeMs || 0) + stats.totalResponseTimeMs,
      totalResponseCount: (d.totalResponseCount || 0) + stats.responseCount,
      fastestCorrectMs: stats.fastestCorrectMs > 0
        ? Math.min(d.fastestCorrectMs || Infinity, stats.fastestCorrectMs)
        : (d.fastestCorrectMs || 0),
      bestStreak: Math.max(d.bestStreak || 0, stats.bestStreak),
    },
    { merge: true }
  );
};

// Update user profile (displayName, avatar, avatarUrl)
export const updateUserProfile = async (
  userId: string,
  updates: {
    displayName?: string;
    avatar?: string;
    avatarUrl?: string | null;
  }
): Promise<void> => {
  const userRef = doc(db, 'users', userId);

  // Build update object
  const updateData: Record<string, any> = {};

  if (updates.displayName !== undefined) {
    updateData.displayName = updates.displayName;
  }

  if (updates.avatar !== undefined) {
    updateData.avatar = updates.avatar;
  }

  if (updates.avatarUrl !== undefined) {
    // If null, remove the field; otherwise set the URL
    updateData.avatarUrl = updates.avatarUrl === null ? deleteField() : updates.avatarUrl;
  }

  if (Object.keys(updateData).length > 0) {
    await updateDoc(userRef, updateData);
  }
};

// Subscribe to auth state changes
export const subscribeToAuthState = (
  callback: (user: FirebaseAuthTypes.User | null) => void
): (() => void) => {
  return auth().onAuthStateChanged(callback);
};

// Get current Firebase user
export const getCurrentUser = (): FirebaseAuthTypes.User | null => {
  return auth().currentUser;
};
