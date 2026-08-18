import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, TextField } from '@/components/ui/form';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import { disablePush, getPushToken, getPushUnsupportedReason, isPushEnabled, isPushSupported } from '@/services/push';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, setUser, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [vibrationOn, setVibrationOn] = useState(user?.vibrationPreference !== false);
  const [vibrationBusy, setVibrationBusy] = useState(false);

  useEffect(() => {
    isPushEnabled()
      .then(async (enabled) => {
        if (enabled && isPushSupported()) {
          try {
            const token = await getPushToken();
            setPushOn(Boolean(token));
          } catch {
            setPushOn(false);
          }
        } else {
          setPushOn(enabled);
        }
      })
      .catch(() => setPushOn(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.profile.update({ name, phone });
      setUser(res.user);
      setSaved(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const togglePush = async (value: boolean) => {
    setPushBusy(true);
    try {
      if (value) {
        if (!isPushSupported()) {
          Alert.alert(
            'Push unavailable here',
            getPushUnsupportedReason() ||
              'Remote push notifications are not available in this environment. Install the QueueBook development build on a physical Android device.'
          );
          setPushOn(false);
          return;
        }
        const token = await getPushToken();
        if (!token) {
          Alert.alert('Notifications unavailable', 'Permission was denied or the device could not be registered. Enable notifications in your device settings and try again.');
          setPushOn(false);
          return;
        }
        setPushOn(true);
      } else {
        await disablePush();
        setPushOn(false);
      }
    } catch (err: any) {
      setPushOn(false);
      const raw = err?.message || '';
      const firebaseMissing = /googleServicesFile|FirebaseApp is not initialized|Unable to get Firebase|firebase-messaging|firebase/i.test(raw);
      Alert.alert(
        'Push failed to enable',
        firebaseMissing
          ? 'Push notifications are not configured for this Android build. Add the Firebase Android configuration (google-services.json) and rebuild the app.'
          : raw || 'Could not register this device. Check your network connection and try again.'
      );
    } finally {
      setPushBusy(false);
    }
  };

  const sendTestPush = async () => {
    setTestBusy(true);
    try {
      const res = await api.push.testPush();
      Alert.alert(
        res.sent > 0 ? 'Test push sent' : 'Test push not delivered',
        `${res.sent} of ${res.devices} device(s) reached. Check your phone's notification tray (background the app to confirm).`
      );
    } catch (err: any) {
      Alert.alert('Test push failed', err?.message || 'Could not send a test push right now.');
    } finally {
      setTestBusy(false);
    }
  };

  const toggleVibration = async (value: boolean) => {
    setVibrationBusy(true);
    try {
      const res = await api.profile.update({ vibrationPreference: value });
      setUser(res.user);
      setVibrationOn(value);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update settings');
    } finally {
      setVibrationBusy(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign out?', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Profile</Text>

      <Card>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>ACCOUNT</Text>
        <TextField label="Full Name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
        <TextField label="Email" value={user?.email || ''} editable={false} />

        <TextField
          label="Phone Number (for SMS/WhatsApp updates)"
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
        />

        <Button title="Save Changes" onPress={handleSave} loading={saving} />
        {saved ? (
          <Text style={{ color: theme.success, fontSize: 13, marginTop: Spacing.two }}>Profile updated</Text>
        ) : null}
      </Card>

      <Card style={styles.pushCard}>
        <View style={styles.pushRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, { color: theme.text }]}>Push Notifications</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
              Get alerts on this device when your queue position updates or your turn is called.
            </Text>
            {!isPushSupported() ? (
              <Text style={{ color: theme.danger, fontSize: 12, marginTop: 4 }}>
                Remote push needs the QueueBook development build on a physical Android device (not Expo Go).
              </Text>
            ) : null}
          </View>
          <Switch
            value={pushOn}
            onValueChange={togglePush}
            disabled={pushBusy}
            trackColor={{ false: theme.border, true: theme.tint }}
            thumbColor="#ffffff"
          />
        </View>
        {pushOn ? (
          <Button
            title="Send test push"
            variant="secondary"
            onPress={sendTestPush}
            loading={testBusy}
            style={{ marginTop: Spacing.two }}
          />
        ) : null}
      </Card>

      <Card style={styles.pushCard}>
        <View style={styles.pushRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, { color: theme.text }]}>Vibration notifications</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
              Vibrate this device when your turn is near or called, including push notifications.
            </Text>
          </View>
          <Switch
            value={vibrationOn}
            onValueChange={toggleVibration}
            disabled={vibrationBusy}
            trackColor={{ false: theme.border, true: theme.tint }}
            thumbColor="#ffffff"
          />
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SESSION</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
          Signed in as {user?.email}
        </Text>
        <Button title="Sign Out" variant="danger" onPress={handleLogout} style={{ marginTop: Spacing.three }} />
      </Card>
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
    marginBottom: Spacing.three,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
    textTransform: 'uppercase',
  },
  pushCard: {
    marginTop: Spacing.three,
  },
  pushRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
});
