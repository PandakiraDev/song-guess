import { useEffect, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import {
  signUpWithEmail,
  signInWithEmail,
  signOut,
  createGuestUser,
  getUserData,
  subscribeToAuthState,
} from '../services/authService';

export const useAuth = () => {
  const { user, isLoading, isAuthenticated, setUser, setLoading, clearUser, loadStoredUser } =
    useUserStore();

  // Initialize auth state
  useEffect(() => {
    loadStoredUser();

    // Subscribe to Firebase auth state changes
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUserData(firebaseUser.uid);
        if (userData) {
          setUser(userData);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in as guest
  const signInAsGuest = useCallback(
    (displayName: string) => {
      const guestUser = createGuestUser(displayName);
      setUser(guestUser);
      return guestUser;
    },
    [setUser]
  );

  // Sign up with email
  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      setLoading(true);
      try {
        const userData = await signUpWithEmail(email, password, displayName);
        setUser(userData);
        return userData;
      } catch (error) {
        // Re-throw the error so it can be caught by the caller
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading]
  );

  // Sign in with email
  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const userData = await signInWithEmail(email, password);
        if (userData) {
          setUser(userData);
        }
        return userData;
      } catch (error) {
        // Re-throw the error so it can be caught by the caller
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading]
  );

  // Sign out
  const handleSignOut = useCallback(async () => {
    try {
      // Only call Firebase signOut for non-guest users
      if (user && !user.isGuest) {
        await signOut();
      }
      clearUser();
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear user anyway
      clearUser();
    }
  }, [user, clearUser]);

  return {
    user,
    isLoading,
    isAuthenticated,
    signInAsGuest,
    signUp,
    signIn,
    signOut: handleSignOut,
  };
};
