import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider, useAuth } from '@/context/auth';
import { onNotificationTap, setupForegroundHandler } from '@/services/push';
import { useTheme } from '@/hooks/use-theme';

function RootNavigator() {
  const { user, loading } = useAuth();
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    setupForegroundHandler();
    const unsubscribe = onNotificationTap((data) => {
      if (data?.queue) {
        router.push('/(tabs)/queue');
      }
    });
    return () => unsubscribe?.();
  }, [router]);

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
