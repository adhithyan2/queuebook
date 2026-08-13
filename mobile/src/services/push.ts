import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';

type NotificationsModule = typeof import('expo-notifications');

export type PushToken = string | null;

export type PushEnvironment = 'expo-go' | 'development-build' | 'web';

const PUSH_TOKEN_KEY = 'pushToken';

let _notifications: NotificationsModule | null | undefined = undefined;
let _handlerInstalled = false;

/**
 * Returns where the app is running:
 * - 'expo-go'            : the public Expo Go client
 * - 'development-build'  : an Expo dev build / standalone production app
 * - 'web'                : react-native-web (browser)
 *
 * expo-notifications' remote push was removed from Expo Go on Android in
 * SDK 53, so this drives whether we may even attempt to load the module.
 */
export function getPushEnvironment(): PushEnvironment {
  if (Platform.OS === 'web') return 'web';
  try {
    const c = Constants as any;
    if (c.executionEnvironment === 'storeClient' || c.appOwnership === 'expo') {
      return 'expo-go';
    }
  } catch {
    // Constants unavailable; treat as a native build below.
  }
  return 'development-build';
}

/**
 * Lazy access to the expo-notifications module.
 *
 * IMPORTANT: On Android inside Expo Go the module throws when it is loaded
 * (SDK 53+ removed remote push there). We therefore return null and never
 * require() it in that environment. It is only loaded when it is actually
 * supported:
 *   - iOS Expo Go (remote push still works there)
 *   - native development builds / standalone apps
 */
function getNotifications(): NotificationsModule | null {
  const env = getPushEnvironment();
  if (env === 'web') return null;
  if (env === 'expo-go' && Platform.OS === 'android') return null;

  if (_notifications !== undefined) return _notifications;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _notifications = require('expo-notifications');
  } catch (err: any) {
    console.warn('expo-notifications unavailable on this platform:', err?.message);
    _notifications = null;
  }
  return _notifications ?? null;
}

/**
 * True only when remote push can actually be obtained on this runtime.
 * - Web / Android+Expo Go  -> false (never touches the module)
 * - iOS Expo Go            -> true
 * - Native dev/standalone  -> true
 */
export function isPushSupported(): boolean {
  const env = getPushEnvironment();
  if (env === 'web') return false;
  if (env === 'expo-go' && Platform.OS === 'android') return false;
  return getNotifications() !== null;
}

export async function getPushToken(): Promise<PushToken> {
  // Avoid re-requesting permission / re-registering if already done.
  const existing = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (existing) return existing;

  if (!isPushSupported()) return null;

  const Notifications = getNotifications();
  if (!Notifications) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'QueueBook',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const existingPerm = await Notifications.getPermissionsAsync();
  let status = existingPerm.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : {});
  await api.push.register(token.data, 'expo');
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);
  return token.data;
}

export async function disablePush() {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (token) {
      await api.push.unregister(token).catch(() => {});
    }
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to disable push notifications:', err);
  }
}

export function isPushEnabled(): Promise<boolean> {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY).then(Boolean);
}

/**
 * Register a listener that fires when the user taps a notification.
 * Returns an unsubscribe function, or null when notifications are unsupported.
 */
export function onNotificationTap(handler: (data: any) => void): (() => void) | null {
  if (!isPushSupported()) return null;
  const Notifications = getNotifications();
  if (!Notifications) return null;
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    handler(response.notification.request.content.data);
  });
  return () => sub.remove();
}

/**
 * Install the foreground notification handler. No-op when push is unsupported
 * (e.g. Expo Go on Android) and safe to call repeatedly.
 */
export function setupForegroundHandler() {
  if (!isPushSupported()) return;
  const Notifications = getNotifications();
  if (!Notifications || _handlerInstalled) return;
  _handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
