import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useRouter } from 'expo-router';

import { Button, Card } from '@/components/ui/form';
import { api } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const STATUS_LABEL: Record<string, string> = {
  waiting: 'In Queue',
  called: 'Now Serving',
  completed: 'Completed',
  skipped: 'Skipped',
  cancelled: 'Cancelled',
};

export default function QueueScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isFocused = useIsFocused();
  const [queues, setQueues] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.queue.my();
      setQueues(data.queues || []);
    } catch (err) {
      console.warn('Queue load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on focus
    load();
    timer.current = setInterval(load, 15000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [isFocused, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleLeave = (id: string) => {
    Alert.alert('Leave queue?', 'You will lose your spot in the queue.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.queue.leave(id);
            await load();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to leave queue');
          }
        },
      },
    ]);
  };

  const active = queues.find((q) => ['waiting', 'called'].includes(q.status));
  const past = queues.filter((q) => !['waiting', 'called'].includes(q.status));

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}>
      <Text style={[styles.title, { color: theme.text }]}>My Queue</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Live status updates every 15 seconds</Text>

      {active ? (
        <>
          {active.status === 'called' && (
            <Card style={[styles.turnCard, { borderColor: theme.success }]}>
              <Text style={{ color: theme.success, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>
                {"It's your turn!"}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                Please proceed to the service desk with token Q{active.tokenNumber}
              </Text>
            </Card>
          )}

          <Card style={[styles.queueCard, { borderColor: theme.tint }]}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              {active.business?.name || 'Business'}
            </Text>
            <View style={styles.queueRow}>
              <View style={[styles.tokenBox, { backgroundColor: theme.tint }]}>
                <Text style={styles.tokenNumber}>Q{active.tokenNumber}</Text>
                <Text style={styles.tokenLabel}>{active.status === 'called' ? 'NOW' : 'TOKEN'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusText, { color: active.status === 'called' ? theme.success : theme.text }]}>
                  {STATUS_LABEL[active.status] || active.status}
                </Text>
                {active.status === 'waiting' && (
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                    {active.position} in line · ~{active.estimatedWaitTime} min wait
                  </Text>
                )}
              </View>
            </View>

            {active.status === 'waiting' && (
              <Button
                title="Leave Queue"
                variant="secondary"
                onPress={() => handleLeave(active._id)}
                style={{ marginTop: Spacing.three }}
              />
            )}
          </Card>

          <Pressable onPress={() => router.push('/explore')}>
            <Text style={{ color: theme.tint, fontWeight: '600', textAlign: 'center', marginTop: Spacing.two }}>
              Join another queue
            </Text>
          </Pressable>
        </>
      ) : (
        !loading && (
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Not in any queue</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 4 }}>
              Find a nearby business and book your spot to skip the wait.
            </Text>
            <Button title="Find a Business" onPress={() => router.push('/explore')} style={{ marginTop: Spacing.three }} />
          </Card>
        )
      )}

      {past.length > 0 && (
        <View style={{ marginTop: Spacing.four }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today</Text>
          {past.map((q) => (
            <Card key={q._id} style={styles.pastCard}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{q.business?.name || 'Business'}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  Q{q.tokenNumber} · {STATUS_LABEL[q.status] || q.status}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: Spacing.three,
  },
  turnCard: {
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  queueCard: {
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
    textTransform: 'uppercase',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  tokenBox: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenNumber: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  tokenLabel: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusText: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  pastCard: {
    flexDirection: 'row',
    marginBottom: Spacing.two,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
});
