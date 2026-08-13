import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';

type NotificationsModule = typeof import('expo-notifications');

let _notifications: NotificationsModule | null = null;

/**
 * expo-notifications throws at import time on Android inside Expo Go (SDK 53+).
 * Lazy-load it so the rest of the app still works there; push is only available
 * on iOS Expo Go or in a development build on Android.
 */
function getNotifications(): NotificationsModule | null {
  if (_notifications) return _notifications;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _notifications = require('expo-notifications');
  } catch (err: any) {
    console.warn('expo-notifications unavailable on this platform:', err?.message);
    return null;
  }
  return _notifications;
}

export type PushToken = string | null;

export async function getPushToken(): Promise<PushToken> {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'QueueBook',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }

    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : {});
    await api.push.register(token.data, 'expo');
    await AsyncStorage.setItem('pushToken', token.data);
    return token.data;
  } catch (err) {
    console.warn('Failed to register for push notifications:', err);
    return null;
  }
}

export async function disablePush() {
  try {
    const token = await AsyncStorage.getItem('pushToken');
    if (token) {
      await api.push.unregister(token).catch(() => {});
    }
    await AsyncStorage.removeItem('pushToken');
  } catch (err) {
    console.warn('Failed to disable push notifications:', err);
  }
}

export function isPushEnabled(): Promise<boolean> {
  return AsyncStorage.getItem('pushToken').then(Boolean);
}

/**
 * Register a listener that fires when the user taps a notification.
 * Returns an unsubscribe function, or null if notifications are unavailable.
 */
export function onNotificationTap(handler: (data: any) => void): (() => void) | null {
  const Notifications = getNotifications();
  if (!Notifications) return null;
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    handler(response.notification.request.content.data);
  });
  return () => sub.remove();
}

/**
 * Optional: keep the app's foreground notification handler set up once.
 * Safe to call repeatedly; no-op when expo-notifications is unavailable.
 */
export function setupForegroundHandler() {
  const Notifications = getNotifications();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
