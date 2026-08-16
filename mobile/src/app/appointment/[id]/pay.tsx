import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card, TextField } from '@/components/ui/form';
import { api } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function PayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [method, setMethod] = useState('upi');
  const [transactionId, setTransactionId] = useState('');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.appointments.payment(id);
      setData(res);
      setMethod(res.business?.paymentMode === 'pay_at_business' ? 'pay_at_business' : 'upi');
    } catch (err: any) {
      setError(err.message || 'Failed to load payment details');
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    load();
  }, [load]);

  const handlePay = async () => {
    const appt = data?.appointment || {};
    if (appt.paymentStatus === 'paid') {
      Alert.alert('Already paid', 'This appointment is already paid.');
      router.replace('/(tabs)/queue');
      return;
    }
    if (method === 'pay_at_business' || method === 'cash') {
      await payWith({ method });
      return;
    }
    if (!transactionId.trim()) {
      setError('Please enter the UPI transaction reference');
      return;
    }
    await payWith({ method, transactionId: transactionId.trim() });
  };

  const payWith = async (body: { method: string; transactionId?: string }) => {
    setError('');
    setPaying(true);
    try {
      const res = await api.appointments.pay(id, body);
      if (res?.awaitingVerification) {
        Alert.alert(
          'Payment submitted for verification',
          'The business will confirm your payment before you receive a token. Track it in your appointments.'
        );
      } else {
        Alert.alert('Booking confirmed', 'The advance will be collected at the business.', [
          {
            text: 'View Queue',
            onPress: () => router.replace('/(tabs)/queue'),
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (error && !data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.danger }}>{error}</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textSecondary }}>Loading…</Text>
      </View>
    );
  }

  const appt = data.appointment;
  const biz = data.business;
  const isPaid = appt.paymentStatus === 'paid';
  const awaiting = !isPaid && appt.paymentStatus === 'pending' && Boolean(appt.paymentInitiatedAt);
  const payMode = biz?.paymentMode || 'both';
  const gatewayConfigured = Boolean(biz?.gatewayConfigured);
  const showUpi = !isPaid && !awaiting && (payMode === 'online' || payMode === 'both') && gatewayConfigured;
  const showAtBusiness = !isPaid && !awaiting && (payMode === 'pay_at_business' || payMode === 'both');

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Advance Payment</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{biz?.name}</Text>

      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Amount</Text>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>
            ₹{appt.advanceAmount || appt.amount || 0}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Status</Text>
          <Text style={{ color: isPaid ? theme.success : theme.tint, fontSize: 14, fontWeight: '700' }}>
            {isPaid ? 'Paid' : awaiting ? 'Awaiting verification' : 'Pending'}
          </Text>
        </View>
      </Card>

      {isPaid ? (
        <Button title="View Queue" onPress={() => router.replace('/(tabs)/queue')} style={{ marginTop: Spacing.three }} />
      ) : awaiting ? (
        <Card style={styles.card}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600', marginBottom: Spacing.two }}>
            Payment submitted for verification
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20 }}>
            {biz?.name} will confirm your advance payment before you receive a token. You can track it in your
            appointments.
          </Text>
          {appt.paymentTransactionId ? (
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: Spacing.two, fontFamily: 'monospace' }}>
              Ref: {appt.paymentTransactionId}
            </Text>
          ) : null}
        </Card>
      ) : (
        <>
          {showUpi ? (
            <Card style={styles.card}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>PAY TO UPI ID</Text>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600', marginBottom: Spacing.two }}>
                {biz?.upiId}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: Spacing.two }}>
                Pay ₹{appt.advanceAmount || appt.amount || 0} using any UPI app, then enter the transaction
                reference below to confirm your spot.
              </Text>
              <TextField
                label="UPI transaction reference"
                value={transactionId}
                onChangeText={setTransactionId}
                placeholder="e.g. 418923XXXXXX"
                autoCapitalize="none"
              />
              {showAtBusiness && (
                <Text
                  style={{ color: theme.tint, fontSize: 13, fontWeight: '600', marginTop: Spacing.two }}
                  onPress={() => setMethod('pay_at_business')}>
                  Prefer to pay at the business instead?
                </Text>
              )}
            </Card>
          ) : null}

          {showAtBusiness && !showUpi ? (
            <Card style={styles.card}>
              <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20 }}>
                This business accepts payment at the desk. Confirm now to book your spot — the advance will be
                settled when you arrive.
              </Text>
            </Card>
          ) : null}

          {error ? <Text style={{ color: theme.danger, fontSize: 13, marginTop: Spacing.two }}>{error}</Text> : null}

          <Button
            title={method === 'pay_at_business' || method === 'cash' ? 'Confirm at Business' : 'Submit Payment for Verification'}
            onPress={handlePay}
            loading={paying}
            style={{ marginTop: Spacing.three }}
          />
        </>
      )}
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
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: Spacing.three,
  },
  card: {
    marginBottom: Spacing.three,
    padding: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
});
