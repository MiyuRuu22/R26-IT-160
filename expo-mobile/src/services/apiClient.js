import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Determine API URL based on environment and runtime
 * - Use EXPO_PUBLIC_API_URL for a physical device on the same Wi-Fi network
 * - For Android emulator: Use 10.0.2.2:5000 (Android Gateway)
 * - For iOS simulator and web: Use localhost:5000
 * - Fallback: http://localhost:5000
 */
const getApiUrl = () => {
  // An explicitly configured URL is authoritative. In particular, do not
  // silently replace it on Android: a physical Android phone needs the
  // laptop's LAN address, not its own localhost or the emulator gateway.
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // iOS simulator can access the host loopback directly.
  if (Platform.OS === 'ios') {
    return 'http://localhost:5000';
  }

  // For Android emulator, use Android's gateway IP
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  // Check Constants for any build-time configuration
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }

  // Default fallback
  return 'http://localhost:5000';
};

const API_URL = getApiUrl();
const TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10);

console.log('[API Client] Using API URL:', API_URL);
console.log('[API Client] Platform:', Platform.OS);

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Add response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response OK: ${response.config.url}`);
    return response.data;
  },
  (error) => {
    if (error.response) {
      console.error(`[API] Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('[API] No response received:', error.request);
    } else {
      console.error('[API] Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
