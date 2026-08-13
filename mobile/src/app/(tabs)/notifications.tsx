import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from 'expo-router';

import { Card } from '@/components/ui/form';
import { api } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const isFocused = useIsFocused();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.notifications.getAll();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.warn('Notifications load error:', err);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on focus
      load();
    }
  }, [isFocused, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const markRead = async (id: string) => {
    await api.notifications.markRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  };

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: Spacing.three, paddingBottom: Spacing.five }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
      data={notifications}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={
        <>
          <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Queue updates and booking alerts
          </Text>
        </>
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => markRead(item._id)}>
          <Card style={[styles.notifCard, !item.read && { borderColor: theme.tint }]}>
            <View style={styles.row}>
              <View style={[styles.dot, !item.read && { backgroundColor: theme.tint }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
                  {item.message}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4, opacity: 0.8 }}>
                  {timeAgo(item.createdAt)}
                </Text>
              </View>
            </View>
          </Card>
        </Pressable>
      )}
      ListEmptyComponent={
        <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: Spacing.four }}>
          No notifications yet
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: Spacing.three,
  },
  notifCard: {
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
    marginTop: 5,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
});
