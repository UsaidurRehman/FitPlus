import { create } from 'zustand';
import * as authApi from '../api/endpoints';
import { User } from '../api/types';
import { clearToken, loadToken, saveToken } from '../utils/storage';

// Simple shape of our auth state.
interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;          // true while we are checking for a saved session
  error: string | null;

  // actions
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Zustand store. One global place to read/write auth state.
export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  loading: true,
  error: null,

  // Called once when the app starts. Tries to log back in from the saved token.
  bootstrap: async () => {
    set({ loading: true, error: null });
    const token = await loadToken();
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const user = await authApi.me();
      set({ user, token, isLoggedIn: true, loading: false });
    } catch {
      // Token is bad or expired — wipe it.
      await clearToken();
      set({ user: null, token: null, isLoggedIn: false, loading: false });
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const { token, user } = await authApi.login({ email, password });
      await saveToken(token);
      set({ token, user, isLoggedIn: true });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        (e?.message === 'Network Error' || !e?.response
          ? 'Cannot connect to server. Check your network or API URL.'
          : 'Could not log in. Check your email and password.');
      set({ error: msg });
      throw new Error(msg);
    }
  },

  register: async (fullName, email, password) => {
    set({ error: null });
    try {
      const { token, user } = await authApi.register({ fullName, email, password });
      await saveToken(token);
      set({ token, user, isLoggedIn: true });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        (e?.message === 'Network Error' || !e?.response
          ? 'Cannot connect to server. Check your network or API URL.'
          : 'Could not create your account. Try a different email.');
      set({ error: msg });
      throw new Error(msg);
    }
  },

  logout: async () => {
    await clearToken();
    set({ user: null, token: null, isLoggedIn: false, error: null });
  },
}));
