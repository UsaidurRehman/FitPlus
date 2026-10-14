import axios from 'axios';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { loadToken } from '../utils/storage';

// FitPulse Dev Proxy runs on port 5000 and forwards requests to IIS Express (port 52611).
// This is necessary because IIS Express only accepts requests from localhost, blocking
// mobile devices on Wi-Fi or Mobile Hotspot with 'HTTP 400 Bad Request (Invalid Hostname)'.
const PORT = 5000;
const PROTOCOL = 'http';

// Tell TypeScript that process.env exists in Expo
declare const process: { env: { EXPO_PUBLIC_API_URL?: string } };

// Automatically extract your PC's IP address from Expo's Metro bundler connection
function getDevHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0]; // Returns your computer's local Wi-Fi IP (e.g. 192.168.x.x)
  }
  return 'localhost';
}

function resolveBaseUrl(): string {
  // 1. If an environment variable is explicitly provided, use it
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Web browser running on the same PC
  if (Platform.OS === 'web') {
    return `${PROTOCOL}://localhost:${PORT}/api`;
  }

  // 3. Android Emulator (only if running inside emulator, not a real phone)
  if (Platform.OS === 'android' && !Device.isDevice) {
    return `${PROTOCOL}://10.0.2.2:${PORT}/api`;
  }

  // 4. Physical Devices (Android / iOS) connected over Wi-Fi
  const pcIp = getDevHost();
  return `${PROTOCOL}://${pcIp}:${PORT}/api`;
}

const BASE_URL = resolveBaseUrl();
console.log('FitPulse API Base URL:', BASE_URL);

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT before every request
api.interceptors.request.use(async (config) => {
  const token = await loadToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});