import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

const TOKEN_KEY = 'n1lift_token';

interface UserState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setAuth: (token: string, user: User) => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Global auth + user state using Zustand.
 * Token is persisted in Expo SecureStore.
 */
export const useUserStore = create<UserState>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  /** Save token + user after successful login */
  setAuth: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token, user });
  },

  /** Load persisted token on app start */
  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        // Token exists — user state will be fetched by the app on mount
        set({ token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  /** Clear auth state and stored token */
  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ token: null, user: null });
  },
}));
