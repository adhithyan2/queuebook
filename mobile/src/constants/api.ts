import Constants from 'expo-constants';

/**
 * Backend base URL resolution:
 *
 * 1. EXPO_PUBLIC_API_URL — explicit override (set in a `.env` file or shell).
 *    For a real Android phone pointing at this PC on the same Wi-Fi:
 *      EXPO_PUBLIC_API_URL=http://<YOUR_PC_LAN_IP>:5000/api
 *
 * 2. Expo Go on a physical device — the Metro host (hostUri) is the PC's LAN
 *    IP, so the API host is derived from it automatically (port 5000).
 *
 * 3. Fallback for web / local simulator.
 */
function getBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:5000/api`;
  }

  return 'http://localhost:5000/api';
}

export const API_URL = getBaseUrl();

/**
 * Web origin / host used to build absolute URLs (e.g. queue scan links).
 * Falls back to the API host when no web origin is known.
 */
export const APP_BASE_URL = process.env.EXPO_PUBLIC_APP_URL || API_URL.replace(/\/api\/?$/, '');
