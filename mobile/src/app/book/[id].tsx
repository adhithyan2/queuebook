import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/form';
import { api } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const DAYS: { date: string; day: string; num: number; month: string }[] = (() => {
  const out: { date: string; day: string; num: number; month: string }[] = [];
  const base = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(base.getTime());
    d.setDate(base.getDate() + i);
    out.push({
      date: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      num: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    });
  }
  return out;
})();

const STAFF_DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const dayNameForDate = (dateStr?: string | null) => {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return STAFF_DAY_NAMES[d.getDay()] ?? null;
};

const isStaffAvailableOnDate = (member: any, dateStr?: string | null) => {
  if (!member || member.isActive === false) return false;
  const dayName = dayNameForDate(dateStr);
  if (!dayName) return false;
  const day = member.availability && member.availability[dayName];
  if (!day || day.off) return false;
  return Boolean(day.open && day.close);
};

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();

  const [business, setBusiness] = useState<any>(null);
  const [service, setService] = useState('');
  const [staff, setStaff] = useState('any');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'advance' | 'walk_in'>('advance');

  const istHHMM = (iso?: string | null) => {
    if (!iso) return '';
    const ist = new Date(new Date(iso).getTime() + 5.5 * 3600 * 1000);
    return `${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')}`;
  };

  const switchMode = (m: 'advance' | 'walk_in') => {
    setMode(m);
    if (m === 'walk_in') {
      setDate(DAYS[0]?.date || '');
      setTime('');
    }
  };

  useEffect(() => {
    api
      .business(id)
      .then((res) => {
        setBusiness(res.business);
        const firstAvailable = (res.business.services || []).find((s: any) => s.isAvailable !== false);
        setService(firstAvailable?.name || res.business.services?.[0]?.name || '');
        setDate(DAYS[0]?.date || '');
      })
      .catch((err: any) => setError(err.message || 'Failed to load business'));
  }, [id]);

  useEffect(() => {
    if (!business || !service || !date) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on selection change
    setSlots([]);
    setTime('');
    setLoadingSlots(true);
    api
      .slots({ business: id, date, service, staff: staff === 'any' ? undefined : staff })
      .then((res) => {
        const list = (res.slots || []).map((s: any) => (typeof s === 'string' ? s : s.time));
        setSlots(list);
        if (mode === 'walk_in' && list.length > 0) {
          const now = new Date();
          const nowMin = now.getHours() * 60 + now.getMinutes();
          const next = list.find((t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m > nowMin;
          });
          setTime(next || list[0]);
        }
      })
      .catch((err: any) => setError(err.message || 'Failed to load time slots'))
      .finally(() => setLoadingSlots(false));
  }, [business, id, service, date, staff, mode]);

  const staffOptions = (business?.staff || []).filter(
    (s: any) => s.isActive !== false && isStaffAvailableOnDate(s, date)
  );

  useEffect(() => {
    if (staff === 'any' || !business) return;
    const member = (business.staff || []).find((s: any) => String(s._id) === String(staff));
    if (member && !isStaffAvailableOnDate(member, date)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset staff when they stop being available on the selected date
      setStaff('any');
      setTime('');
    }
  }, [business, staff, date]);

  const grouped = useMemo(() => {
    const groups: Record<string, string[]> = { Morning: [], Afternoon: [], Evening: [] };
    for (const slot of slots) {
      const hour = parseInt(slot.split(':')[0], 10);
      if (hour < 12) groups.Morning.push(slot);
      else if (hour < 16) groups.Afternoon.push(slot);
      else groups.Evening.push(slot);
    }
    return Object.entries(groups).filter(([, list]) => list.length > 0);
  }, [slots]);

  const handleBook = async () => {
    if (!service || !date || !time) {
      setError('Please select a service, date and time');
      return;
    }
    setError('');
    setBooking(true);
    try {
      const res = await api.appointments.create({
        business: id,
        service,
        date,
        timeSlot: time,
        staff: staff === 'any' ? undefined : staff,
        bookingType: mode,
      });
      const appointment = res?.appointment;
      if (res?.paymentRequired && appointment) {
        Alert.alert(
          'Advance payment required',
          mode === 'walk_in'
            ? 'Complete the advance payment to confirm your spot in the queue.'
            : 'Complete the advance payment to confirm your appointment.',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Pay Now',
              onPress: () => router.replace(`/appointment/${appointment._id}/pay`),
            },
          ]
        );
        return;
      }
      if (mode === 'walk_in') {
        Alert.alert('Booking confirmed', 'You are now in the queue. We will notify you when your turn is near.', [
          {
            text: 'View Queue',
            onPress: () => router.replace('/(tabs)/queue'),
          },
        ]);
        return;
      }
      const endTime = appointment?.expectedEndTime || '';
      const arriveBy = istHHMM(appointment?.arrivalWindowStart) || appointment?.timeSlot || '';
      const staffName = appointment?.staffName || '';
      Alert.alert(
        'Booking confirmed',
        `Appointment: ${appointment?.timeSlot}${staffName ? `\nStaff: ${staffName}` : ''}\n` +
          `Expected service: ${appointment?.timeSlot} – ${endTime}\n` +
          `Arrive by: ${arriveBy}\n` +
          'Status: Scheduled',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/queue'),
          },
        ]
      );
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

  if (!business.services?.length) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>{business.name}</Text>
        <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.two }}>
          No services available yet.
        </Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: Spacing.four }} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{business.name}</Text>

      <View style={styles.modeRow}>
        <Pressable
          onPress={() => switchMode('advance')}
          style={[
            styles.modeChip,
            { backgroundColor: mode === 'advance' ? theme.tint : theme.backgroundElement, borderColor: mode === 'advance' ? theme.tint : theme.border },
          ]}>
          <Text style={{ color: mode === 'advance' ? '#ffffff' : theme.text, fontWeight: '600' }}>Book an appointment</Text>
        </Pressable>
        <Pressable
          onPress={() => switchMode('walk_in')}
          style={[
            styles.modeChip,
            { backgroundColor: mode === 'walk_in' ? theme.tint : theme.backgroundElement, borderColor: mode === 'walk_in' ? theme.tint : theme.border },
          ]}>
          <Text style={{ color: mode === 'walk_in' ? '#ffffff' : theme.text, fontWeight: '600' }}>Join queue now</Text>
        </Pressable>
      </View>
      <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: Spacing.three }}>
        {mode === 'advance'
          ? 'Book a future slot. You will check in on arrival and then receive a live queue token.'
          : 'Join the live queue now and get a token immediately.'}
      </Text>

      <View>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SELECT SERVICE</Text>
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
      </View>

      <View style={{ marginTop: Spacing.three }}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SELECT STAFF (OPTIONAL)</Text>
        <View style={styles.chips}>
          <Pressable
            onPress={() => setStaff('any')}
            style={[
              styles.chip,
              {
                backgroundColor: staff === 'any' ? theme.tint : theme.backgroundElement,
                borderColor: staff === 'any' ? theme.tint : theme.border,
              },
            ]}>
            <Text style={{ color: staff === 'any' ? '#ffffff' : theme.text, fontWeight: '600' }}>Any</Text>
          </Pressable>
          {staffOptions.map((s: any) => (
            <Pressable
              key={s._id}
              onPress={() => setStaff(s._id)}
              style={[
                styles.chip,
                {
                  backgroundColor: staff === s._id ? theme.tint : theme.backgroundElement,
                  borderColor: staff === s._id ? theme.tint : theme.border,
                },
              ]}>
              <Text style={{ color: staff === s._id ? '#ffffff' : theme.text, fontWeight: '600' }}>{s.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ marginTop: Spacing.three }}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SELECT DATE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
          {DAYS.map((d) => (
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
        {loadingSlots ? (
          <View style={styles.slotsLoading}>
            <ActivityIndicator color={theme.tint} />
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginLeft: Spacing.two }}>
              Checking real availability…
            </Text>
          </View>
        ) : grouped.length === 0 ? (
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
            No slots available for the selected date{staff !== 'any' ? ' and staff' : ''}.
          </Text>
        ) : (
          grouped.map(([period, slotsList]) => (
            <View key={period} style={{ marginBottom: Spacing.two }}>
              <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{period}</Text>
              <View style={styles.timeGrid}>
                {slotsList.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setTime(t)}
                    style={[
                      styles.timeChip,
                      {
                        backgroundColor: time === t ? theme.tint : theme.backgroundElement,
                        borderColor: time === t ? theme.tint : theme.border,
                      },
                    ]}>
                    <Text style={{ color: time === t ? '#ffffff' : theme.text, fontSize: 13, fontWeight: '600' }}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </View>

      {error ? <Text style={{ color: theme.danger, fontSize: 13, marginTop: Spacing.two }}>{error}</Text> : null}

      <Button title={mode === 'walk_in' ? 'Join Queue Now' : 'Confirm Booking'} onPress={handleBook} loading={booking} style={{ marginTop: Spacing.three }} />
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
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
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
  slotsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
});
