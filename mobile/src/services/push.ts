import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';

type NotificationsModule = typeof import('expo-notifications');

export type PushToken = string | null;

export type PushEnvironment = 'expo-go' | 'development-build' | 'web';

const PUSH_TOKEN_KEY = 'pushToken';

export const DEFAULT_CHANNEL_ID = 'queuebook-default';
export const QUIET_CHANNEL_ID = 'queuebook-quiet';

let _notifications: NotificationsModule | null | undefined = undefined;
let _handlerInstalled = false;
let _channelsConfigured: Promise<void> | null = null;

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
 * - Native dev/standalone  -> true only on a physical device
 *
 * expo-device gates token registration to physical hardware: emulators and
 * simulators cannot reliably register an Expo push token, so we treat them as
 * unsupported rather than crashing or silently failing.
 */
export function isPushSupported(): boolean {
  const env = getPushEnvironment();
  if (env === 'web') return false;
  if (env === 'expo-go' && Platform.OS === 'android') return false;
  if (getNotifications() === null) return false;
  try {
    if (!Device.isDevice) return false;
  } catch {
    // expo-device unavailable; assume a physical device below.
  }
  return true;
}

/**
 * Human-readable reason push is unavailable on this runtime, for warnings.
 * Returns null when push is supported.
 */
export function getPushUnsupportedReason(): string | null {
  const env = getPushEnvironment();
  if (env === 'web') return 'Push notifications are not available on web browsers in this app.';
  if (env === 'expo-go' && Platform.OS === 'android') {
    return 'Android remote push was removed from Expo Go in SDK 53+. Install the QueueBook development build instead.';
  }
  if (getNotifications() === null) return 'expo-notifications is not available on this platform.';
  try {
    if (!Device.isDevice) {
      return 'Push token registration requires a physical Android device (emulators are not supported).';
    }
  } catch {
    // Treat as supported.
  }
  return null;
}

/**
 * Create (once) the Android notification channels used by every QueueBook
 * push. Safe to call from anywhere: it no-ops on non-Android runtimes and in
 * Expo Go on Android, and it never recreates a channel that already exists.
 *
 * - queuebook-default : MAX importance, sound, vibration (default for ON)
 * - queuebook-quiet   : HIGH importance, sound, NO vibration (vibration OFF)
 *
 * The server selects the channel per user via `vibrationPreference`, so the
 * native Android system renders the tray notification correctly even when the
 * app is backgrounded/locked and JavaScript is not running.
 */
export async function configureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (!isPushSupported()) return;

  const Notifications = getNotifications();
  if (!Notifications) return;

  if (_channelsConfigured) return _channelsConfigured;

  _channelsConfigured = (async () => {
    const existingDefault = await Notifications.getNotificationChannelAsync(DEFAULT_CHANNEL_ID);
    if (!existingDefault) {
      await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
        name: 'QueueBook',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 150, 250],
        enableVibrate: true,
        showBadge: true,
      });
    }

    const existingQuiet = await Notifications.getNotificationChannelAsync(QUIET_CHANNEL_ID);
    if (!existingQuiet) {
      await Notifications.setNotificationChannelAsync(QUIET_CHANNEL_ID, {
        name: 'QueueBook (No Vibration)',
        importance: Notifications.AndroidImportance.HIGH,
        enableVibrate: false,
        showBadge: true,
      });
    }
  })().catch((err) => {
    _channelsConfigured = null;
    throw err;
  });

  return _channelsConfigured;
}

export async function getPushToken(): Promise<PushToken> {
  if (!isPushSupported()) return null;

  const Notifications = getNotifications();
  if (!Notifications) return null;

  await configureAndroidChannels();

  const existingPerm = await Notifications.getPermissionsAsync();
  let status = existingPerm.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') {
    console.warn('Push permission denied on device:', status);
    return null;
  }

  // Always fetch a fresh token for the current EAS project and re-register it.
  // The cached token must never be trusted on its own: an APK upgrade keeps
  // AsyncStorage, so a token from a previous project/backend could look valid
  // while the server has no record of it.
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
 * Register a listener that fires as soon as a notification is received while
 * the app is running (foreground). Returns an unsubscribe function, or null
 * when notifications are unsupported.
 */
export function onNotificationReceived(
  handler: (notification: any) => void
): (() => void) | null {
  if (!isPushSupported()) return null;
  const Notifications = getNotifications();
  if (!Notifications) return null;
  const sub = Notifications.addNotificationReceivedListener((notification) => {
    handler(notification);
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
