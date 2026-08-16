import { useCallback, useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, AppState, Vibration, View } from 'react-native';

import { AuthProvider, useAuth } from '@/context/auth';
import { configureAndroidChannels, onNotificationReceived, onNotificationTap, setupForegroundHandler } from '@/services/push';
import { connectSocket, disconnectSocket, subscribe } from '@/services/socket';
import { useTheme } from '@/hooks/use-theme';

const ALERT_TYPES = new Set(['turn_coming', 'one_ahead', 'turn_now']);
const VIBRATION_PATTERNS: Record<string, number[]> = {
  turn_now: [0, 350, 200, 350],
  turn_coming: [0, 250, 150, 250],
  one_ahead: [0, 200],
};
const DEDUPE_MS: Record<string, number> = {
  turn_now: 90000,
  turn_coming: 60000,
  one_ahead: 60000,
};

function RootNavigator() {
  const { user, loading } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const lastAlertAt = useRef<Record<string, number>>({});

  const vibrate = useCallback((type?: string) => {
    if (!type || !ALERT_TYPES.has(type)) return;
    if (user?.vibrationPreference === false) return;
    const now = Date.now();
    const last = lastAlertAt.current[type] || 0;
    if (now - last < (DEDUPE_MS[type] ?? 30000)) return;
    lastAlertAt.current[type] = now;
    Vibration.vibrate(VIBRATION_PATTERNS[type] ?? [250]);
  }, [user]);

  const vibrateReceivedRef = useRef<(notification: any) => void>(() => {});

  const vibrateReceived = useCallback((notification: any) => {
    if (user?.vibrationPreference === false) return;
    const triggerType = notification?.request?.trigger?.type;
    if (triggerType !== 'push') return;
    const data = notification?.request?.content?.data;
    const type = data?.type;
    Vibration.vibrate(VIBRATION_PATTERNS[type] ?? [0, 250, 150, 250]);
    console.log(
      `[push] received: id=${notification?.request?.identifier ?? 'n/a'}, type=${type ?? 'n/a'}, channelId=${data?.channelId ?? 'n/a'}, vibrationPreference=${user?.vibrationPreference}, appState=${AppState.currentState}`
    );
  }, [user]);

  useEffect(() => {
    vibrateReceivedRef.current = vibrateReceived;
  }, [vibrateReceived]);

  useEffect(() => {
    setupForegroundHandler();
    configureAndroidChannels().catch((err) => {
      console.warn('Failed to configure notification channels:', err);
    });
    const unsubscribeTap = onNotificationTap((data) => {
      if (data?.queue) {
        router.push('/(tabs)/queue');
      }
    });
    const unsubscribeReceived = onNotificationReceived((notification) => {
      vibrateReceivedRef.current(notification);
    });
    return () => {
      unsubscribeTap?.();
      unsubscribeReceived?.();
    };
  }, [router]);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }
    connectSocket();
    const unsubscribe = subscribe('new-notification', (payload) => {
      vibrate(payload?.data?.type);
      if (payload?.data?.type === 'turn_now') {
        Alert.alert("It's your turn!", payload.message || 'Please proceed to the service desk.', [
          { text: 'View Queue', onPress: () => router.push('/(tabs)/queue') },
          { text: 'OK', style: 'cancel' },
        ]);
      }
    });
    return () => unsubscribe();
  }, [user, router, vibrate]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>

        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>

        <Stack.Screen name="business/[id]" options={{ headerShown: true, title: 'Business', headerBackTitle: 'Back' }} />
        <Stack.Screen name="book/[id]" options={{ headerShown: true, title: 'Book Appointment', headerBackTitle: 'Back' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
