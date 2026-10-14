import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// One key for everything token-related.
const TOKEN_KEY = 'fitpulse_token';

// Save the JWT to secure storage (or localStorage on web).
export async function saveToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (e) {
    console.warn('Could not save token', e);
  }
}

// Read the JWT back. Returns null if nothing is saved.
export async function loadToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (e) {
    console.warn('Could not load token', e);
    return null;
  }
}

// Delete the saved JWT (used on logout).
export async function clearToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (e) {
    console.warn('Could not clear token', e);
  }
}
