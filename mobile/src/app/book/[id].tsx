import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/form';
import { api } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();

  const [business, setBusiness] = useState<any>(null);
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);

  const days = useMemo(() => {
    const out: { date: string; day: string; num: number; month: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      out.push({
        date: d.toISOString().split('T')[0],
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        num: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
      });
    }
    return out;
  }, []);

  useEffect(() => {
    api
      .business(id)
      .then((res) => {
        setBusiness(res.business);
        setService(res.business.services?.[0]?.name || 'General Service');
        setDate(days[0]?.date || '');
      })
      .catch((err: any) => setError(err.message || 'Failed to load business'));
  }, [id, days]);

  useEffect(() => {
    if (!id || !date || !service) return;
    api.slots
      .get(id, date, service)
      .then((res) => {
        setSlots(res.slots || []);
        setTime('');
      })
      .catch(() => setSlots([]));
  }, [id, date, service]);

  const handleBook = async () => {
    if (!service || !date || !time) {
      setError('Please select a service, date and time');
      return;
    }
    setError('');
    setBooking(true);
    try {
      await api.appointments.create({ business: id, service, date, timeSlot: time });
      Alert.alert('Booking confirmed', 'You are now in the queue. We will notify you when your turn is near.', [
        {
          text: 'View Queue',
          onPress: () => router.replace('/(tabs)/queue'),
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  if (error && !business) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.danger }}>{error}</Text>
      </View>
    );
  }

  if (!business) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textSecondary }}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{business.name}</Text>

      <View>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SELECT SERVICE</Text>
        {business.services?.length > 0 ? (
          <View style={styles.chips}>
            {business.services.map((s: any) => (
              <Pressable
                key={s.name}
                onPress={() => setService(s.name)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: service === s.name ? theme.tint : theme.backgroundElement,
                    borderColor: service === s.name ? theme.tint : theme.border,
                  },
                ]}>
                <Text style={{ color: service === s.name ? '#ffffff' : theme.text, fontWeight: '600' }}>
                  {s.name}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={{ color: theme.textSecondary }}>General Service</Text>
        )}
      </View>

      <View style={{ marginTop: Spacing.three }}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SELECT DATE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
          {days.map((d) => (
            <Pressable
              key={d.date}
              onPress={() => setDate(d.date)}
              style={[
                styles.dateChip,
                {
                  backgroundColor: date === d.date ? theme.tint : theme.backgroundElement,
                  borderColor: date === d.date ? theme.tint : theme.border,
                },
              ]}>
              <Text style={{ color: date === d.date ? '#ffffff' : theme.textSecondary, fontSize: 11, fontWeight: '600' }}>
                {d.day} {d.month}
              </Text>
              <Text style={{ color: date === d.date ? '#ffffff' : theme.text, fontSize: 18, fontWeight: '800' }}>
                {d.num}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={{ marginTop: Spacing.three }}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SELECT TIME</Text>
        {slots.length > 0 ? (
          <View style={styles.timeGrid}>
            {slots.map((s) => (
              <Pressable
                key={s.time}
                disabled={!s.available}
                onPress={() => setTime(s.time)}
                style={[
                  styles.timeChip,
                  {
                    backgroundColor: time === s.time ? theme.tint : theme.backgroundElement,
                    borderColor: time === s.time ? theme.tint : theme.border,
                    opacity: s.available ? 1 : 0.4,
                  },
                ]}>
                <Text style={{ color: time === s.time ? '#ffffff' : theme.text, fontSize: 13, fontWeight: '600' }}>{s.time}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Loading available slots…</Text>
        )}
      </View>

      {error ? <Text style={{ color: theme.danger, fontSize: 13, marginTop: Spacing.two }}>{error}</Text> : null}

      <Button title="Confirm Booking" onPress={handleBook} loading={booking} style={{ marginTop: Spacing.three }} />
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.three,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateRow: {
    gap: Spacing.two,
  },
  dateChip: {
    width: 64,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  timeChip: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
