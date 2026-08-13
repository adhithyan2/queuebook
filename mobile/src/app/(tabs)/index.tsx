import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/form';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.dashboard();
      setDashboard(data);
    } catch (err) {
      console.warn('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const activeQueue = dashboard?.activeQueue;
  const queueStatus = dashboard?.queueStatus;

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: Spacing.three, paddingBottom: Spacing.five }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
      data={dashboard?.nearbyBusinesses || []}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={
        <>
          <Text style={[styles.greeting, { color: theme.text }]}>
            {greeting()}, {user?.name?.split(' ')[0]}!
          </Text>
          <Text style={[styles.subGreeting, { color: theme.textSecondary }]}>
            Here&apos;s what&apos;s happening today
          </Text>

          {activeQueue && (
            <Pressable onPress={() => router.push('/queue')}>
              <Card style={[styles.queueCard, { borderColor: theme.tint }]}>
                <View style={styles.queueRow}>
                  <View style={[styles.tokenBox, { backgroundColor: theme.tint }]}>
                    <Text style={styles.tokenNumber}>{activeQueue.tokenNumber}</Text>
                    <Text style={styles.tokenLabel}>TOKEN</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.queueTitle, { color: theme.text }]}>
                      {activeQueue.business?.name || 'Your queue'}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                      {queueStatus?.peopleAhead ?? 0} ahead · ~{queueStatus?.estimatedWaitTime ?? 0} min
                    </Text>
                    {queueStatus?.currentToken ? (
                      <Text style={{ color: theme.success, fontSize: 13, marginTop: 2 }}>
                        Now serving Q{queueStatus.currentToken}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                </View>
              </Card>
            </Pressable>
          )}

          {dashboard?.upcomingAppointment ? (
            <Card>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>UPCOMING APPOINTMENT</Text>
              <Text style={[styles.itemTitle, { color: theme.text }]}>
                {dashboard.upcomingAppointment.business?.name}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                {dashboard.upcomingAppointment.service} ·{' '}
                {dashboard.upcomingAppointment.timeSlot} · {dashboard.upcomingAppointment.date?.slice(0, 10)}
              </Text>
            </Card>
          ) : null}

          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Nearby Services</Text>
            <Pressable onPress={() => router.push('/explore')}>
              <Text style={{ color: theme.tint, fontSize: 13, fontWeight: '600' }}>View all</Text>
            </Pressable>
          </View>
        </>
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/business/${item._id}`)}>
          <Card style={styles.bizCard}>
            <Text style={[styles.itemTitle, { color: theme.text }]}>{item.name}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
              {item.category} · {item.address}
            </Text>
            <View style={styles.bizMeta}>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                ⭐ {item.averageRating || item.rating || '—'} · {item.reviewCount || 0} reviews
              </Text>
              {item.liveQueue && (
                <Text style={{ color: theme.tint, fontSize: 12, fontWeight: '600' }}>
                  {item.liveQueue.waiting} waiting
                </Text>
              )}
            </View>
          </Card>
        </Pressable>
      )}
      ListEmptyComponent={
        loading ? (
          <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: Spacing.four }}>
            Loading…
          </Text>
        ) : (
          <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: Spacing.four }}>
            No businesses available yet
          </Text>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  greeting: {
    fontSize: 22,
    fontWeight: '700',
  },
  subGreeting: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: Spacing.three,
  },
  queueCard: {
    marginBottom: Spacing.three,
    borderWidth: 1,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  tokenBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenNumber: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  tokenLabel: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  queueTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  bizCard: {
    marginBottom: Spacing.two,
  },
  bizMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
