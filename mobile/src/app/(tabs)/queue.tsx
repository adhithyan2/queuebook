import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

import { Button, Card } from '@/components/ui/form';
import { api } from '@/services/api';
import { joinQueueRoom, subscribe } from '@/services/socket';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const STATUS_LABEL: Record<string, string> = {
  waiting: 'In Queue',
  called: 'Now Serving',
  completed: 'Completed',
  skipped: 'Skipped',
  cancelled: 'Cancelled',
};

/**
 * Renders the real queue scan QR. The payload is the same format the web app
 * uses (`.../queue/<id>/scan`) so the business desk scanner can read it.
 * Includes loading and error states instead of a blank/empty box.
 */
function QueueQR({ queueId }: { queueId?: string }) {
  const theme = useTheme();
  const [ready, setReady] = useState(Boolean(queueId));

  // Adjust state during render when queueId becomes available (documented
  // React pattern) — avoids an effect for a synchronously-rendered QR.
  if (Boolean(queueId) !== ready) {
    setReady(Boolean(queueId));
  }

  if (!queueId) {
    return (
      <View style={[styles.qrFallback, { backgroundColor: theme.backgroundElement }]}>
        <Text style={{ color: theme.danger, fontSize: 12, textAlign: 'center' }}>
          QR code unavailable for this queue.
        </Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={[styles.qrFallback, { backgroundColor: theme.backgroundElement }]}>
        <ActivityIndicator color={theme.tint} />
      </View>
    );
  }

  return (
    <QRCode value={`queuebook://queue/${queueId}/scan`} size={150} color="#0f172a" backgroundColor="#ffffff" ecl="M" />
  );
}

export default function QueueScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isFocused = useIsFocused();
  const [queues, setQueues] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const [qData, aData] = await Promise.all([api.queue.my(), api.appointments.getAll()]);
      const queues = qData.queues || [];
      setQueues(queues);
      setAppointments(aData.appointments || []);
      queues.forEach((q) => joinQueueRoom(q._id));
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

  useEffect(() => {
    const unsubscribe = subscribe('position-update', () => {
      load();
    });
    return unsubscribe;
  }, [load]);

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

  const handleCheckIn = async (apptId: string) => {
    setCheckingIn(apptId);
    try {
      const res = await api.appointments.checkin(apptId);
      Alert.alert(
        'Checked in',
        res.late
          ? `Your appointment time has passed, but you have been placed in the queue. Token Q${res.queue?.tokenNumber}. Please check in with the staff.`
          : `You are now in the queue with token Q${res.queue?.tokenNumber}.`,
        [{ text: 'OK', onPress: () => load() }]
      );
    } catch (err: any) {
      Alert.alert('Check-in failed', err?.message || 'Could not check in right now.');
    } finally {
      setCheckingIn(null);
    }
  };

  const active = queues.find((q) => ['waiting', 'called'].includes(q.status));
  const past = queues.filter((q) => !['waiting', 'called'].includes(q.status));
  const scheduled = appointments.filter(
    (a) => !a.queueEntryId && ['scheduled', 'pending', 'confirmed'].includes(a.status)
  );

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
              {active.business?.name || 'Business unavailable'}
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

            {['waiting', 'called'].includes(active.status) && (
              <View style={[styles.qrSection, { borderTopColor: theme.border }]}>
                <View style={styles.qrBox}>
                  <QueueQR queueId={active._id} />
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center', marginTop: Spacing.two }}>
                  Show this QR at the desk to verify your spot.
                </Text>
              </View>
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
                <Text style={[styles.itemTitle, { color: theme.text }]}>{q.business?.name || 'Business unavailable'}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  Q{q.tokenNumber} · {STATUS_LABEL[q.status] || q.status}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {scheduled.length > 0 && (
        <View style={{ marginTop: Spacing.four }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Appointments</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: Spacing.two }}>
            Check in when you arrive to receive your live queue token.
          </Text>
          {scheduled.map((a) => {
            const pendingPay = a.paymentStatus === 'pending' || a.paymentStatus === 'failed';
            return (
              <Card key={a._id} style={styles.pastCard}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>
                    {a.business?.name || 'Appointment'}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {a.service}
                    {a.timeSlot ? ` · ${a.timeSlot}` : ''}
                    {a.staffName ? ` · ${a.staffName}` : ''}
                  </Text>
                  {a.expectedStartTime && a.expectedEndTime ? (
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                      Expected service: {a.expectedStartTime} – {a.expectedEndTime}
                    </Text>
                  ) : null}
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Status: Scheduled</Text>
                  {pendingPay ? (
                    <Pressable onPress={() => router.push(`/appointment/${a._id}/pay`)}>
                      <Text style={{ color: theme.tint, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
                        Advance payment pending · Pay now ›
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <Button
                  title="Check In"
                  variant="secondary"
                  loading={checkingIn === a._id}
                  onPress={() => handleCheckIn(a._id)}
                  style={{ marginTop: Spacing.two }}
                />
              </Card>
            );
          })}
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
  qrSection: {
    alignItems: 'center',
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  qrBox: {
    padding: Spacing.two,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  qrFallback: {
    width: 150,
    height: 150,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
  },
});
