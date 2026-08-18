import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card } from '@/components/ui/form';
import { api } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function BusinessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const [business, setBusiness] = useState<any>(null);
  const [liveQueue, setLiveQueue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .business(id)
      .then((res) => {
        setBusiness(res.business);
        setLiveQueue(res.liveQueue);
      })
      .catch((err: any) => setError(err.message || 'Failed to load business'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textSecondary }}>Loading…</Text>
      </View>
    );
  }

  if (error || !business) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.danger }}>{error || 'Business not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Card>
        <Text style={[styles.name, { color: theme.text }]}>{business.name}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 2 }}>
          {business.category} · ⭐ {business.rating || '—'}
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 8 }}>{business.address}</Text>
        {business.phone ? (
          <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>{business.phone}</Text>
        ) : null}
        {business.description ? (
          <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 8 }}>{business.description}</Text>
        ) : null}
      </Card>

      {liveQueue && (
        <Card style={styles.queueCard}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>LIVE QUEUE</Text>
          <View style={styles.queueStats}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: theme.text }]}>{liveQueue.waiting != null ? liveQueue.waiting : '—'}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Waiting</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: theme.text }]}>{liveQueue.currentToken || '—'}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Serving</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: theme.text }]}>{liveQueue.estimatedWait != null ? `${liveQueue.estimatedWait}m` : '—'}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Wait</Text>
            </View>
          </View>
        </Card>
      )}

      {business.services?.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Services</Text>
          {business.services.map((s: any, i: number) => (
            <Card key={s._id || `${s.name}-${i}`} style={styles.serviceCard}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.serviceName, { color: theme.text }]}>{s.name}</Text>
                {s.duration ? (
                  <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
                    {s.duration} min{s.price ? ` · ₹${s.price}` : ''}
                  </Text>
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      )}

      <Button title="Book Appointment" onPress={() => router.push(`/book/${id}`)} style={{ marginTop: Spacing.two }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  container: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
  },
  queueCard: {
    marginTop: Spacing.three,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.three,
  },
  queueStats: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  serviceCard: {
    flexDirection: 'row',
    marginBottom: Spacing.two,
    padding: 14,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
  },
});
