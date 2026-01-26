import { create } from 'zustand';
import { User, GuestUser } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  user: User | GuestUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | GuestUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;

  // Persistence
  loadStoredUser: () => Promise<void>;
  persistUser: (user: User | GuestUser) => Promise<void>;
}

const USER_STORAGE_KEY = '@songguess_user';

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: user !== null,
    });

    // Persist user data
    if (user) {
      get().persistUser(user);
    }
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  clearUser: () => {
    set({
      user: null,
      isAuthenticated: false,
    });

    // Clear persisted data
    AsyncStorage.removeItem(USER_STORAGE_KEY).catch(console.error);
  },

  loadStoredUser: async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load stored user:', error);
      set({ isLoading: false });
    }
  },

  persistUser: async (user) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to persist user:', error);
    }
  },
}));

// Selector hooks
export const useUser = () => useUserStore((state) => state.user);
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated);
export const useIsLoading = () => useUserStore((state) => state.isLoading);
