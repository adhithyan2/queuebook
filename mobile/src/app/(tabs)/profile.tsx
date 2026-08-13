import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, TextField } from '@/components/ui/form';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import { disablePush, getPushToken, isPushEnabled } from '@/services/push';
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

  useEffect(() => {
    isPushEnabled().then(setPushOn);
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
        const token = await getPushToken();
        if (!token) {
          Alert.alert('Notifications unavailable', 'Permission was denied. Enable notifications in your device settings.');
          setPushOn(false);
          return;
        }
        setPushOn(true);
      } else {
        await disablePush();
        setPushOn(false);
      }
    } finally {
      setPushBusy(false);
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
          </View>
          <Switch
            value={pushOn}
            onValueChange={togglePush}
            disabled={pushBusy}
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
