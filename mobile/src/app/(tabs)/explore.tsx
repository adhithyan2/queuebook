import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card } from '@/components/ui/form';
import { api } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.nearby();
      setBusinesses(data.businesses || []);
    } catch (err) {
      console.warn('Explore load error:', err);
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

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: Spacing.three, paddingBottom: Spacing.five }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
      data={businesses}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={
        <>
          <Text style={[styles.title, { color: theme.text }]}>Explore</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Find a place and book your spot
          </Text>
        </>
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/business/${item._id}`)}>
          <Card style={styles.bizCard}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bizName, { color: theme.text }]}>{item.name}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
                  {item.category}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              {item.isOpen !== undefined && (
                <View style={[styles.badge, { backgroundColor: item.isOpen ? theme.success + '22' : theme.danger + '22' }]}>
                  <Text style={{ color: item.isOpen ? theme.success : theme.danger, fontSize: 11, fontWeight: '700' }}>
                    {item.isOpen ? 'OPEN' : 'CLOSED'}
                  </Text>
                </View>
              )}
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                ⭐ {item.averageRating || item.rating || '—'}
              </Text>
              {item.distanceKm != null && (
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{item.distanceKm} km</Text>
              )}
            </View>

            <View style={[styles.queueBar, { borderTopColor: theme.border }]}>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                {item.liveQueue?.waiting ?? 0} waiting
              </Text>
              <Text style={{ color: theme.tint, fontSize: 12, fontWeight: '600' }}>
                ~{item.liveQueue?.estimatedWaitTime ?? 0} min wait
              </Text>
            </View>
          </Card>
        </Pressable>
      )}
      ListEmptyComponent={
        <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: Spacing.four }}>
          {loading ? 'Loading…' : 'No businesses found'}
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
    marginBottom: Spacing.three,
    marginTop: 2,
  },
  bizCard: {
    marginBottom: Spacing.three,
  },
  row: {
    flexDirection: 'row',
  },
  bizName: {
    fontSize: 16,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  queueBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
  },
});
