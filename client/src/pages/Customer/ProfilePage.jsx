import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUser, HiOutlineMail, HiOutlineLocationMarker, HiOutlineCheck, HiBell, HiOutlineBell } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { customerAPI } from '../../services/api';
import PhoneVerifyPanel from '../../components/PhoneVerify/PhoneVerifyPanel';
import { isPushSupported, subscribeToPush, unsubscribeFromPush, getExistingSubscription } from '../../services/pushNotifications';

const PushNotificationCard = () => {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushMessage, setPushMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!isPushSupported()) return;
    getExistingSubscription()
      .then((sub) => setPushEnabled(Boolean(sub)))
      .catch(() => setPushEnabled(false));
  }, []);

  const handleToggle = async () => {
    setPushLoading(true);
    setPushMessage({ type: '', text: '' });
    try {
      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
        setPushMessage({ type: 'success', text: 'Browser notifications disabled' });
      } else {
        await subscribeToPush();
        setPushEnabled(true);
        setPushMessage({ type: 'success', text: "Browser notifications enabled — you'll get queue updates here" });
      }
    } catch (error) {
      setPushMessage({ type: 'error', text: error.message || 'Failed to update notification settings' });
    } finally {
      setPushLoading(false);
    }
  };

  if (!isPushSupported()) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Browser Notifications</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Push notifications are not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            {pushEnabled ? <HiBell className="w-5 h-5 text-primary" /> : <HiOutlineBell className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Browser Notifications</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
              Get push alerts in this browser when your queue position updates or your turn is called.
            </p>
            {pushMessage.text && (
              <p className={`mt-2 text-xs font-medium ${
                pushMessage.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
              }`}>
                {pushMessage.text}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={pushLoading}
          className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
            pushEnabled ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700'
          }`}
          aria-label="Toggle browser notifications"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
              pushEnabled ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

const VibrationPreferenceCard = () => {
  const { user, setUser } = useAuth();
  const enabled = user?.vibrationPreference !== false;
  const [vibrating, setVibrating] = useState(false);
  const [vibrateMessage, setVibrateMessage] = useState({ type: '', text: '' });

  const handleToggle = async () => {
    setVibrating(true);
    setVibrateMessage({ type: '', text: '' });
    try {
      const res = await customerAPI.updateProfile({ vibrationPreference: !enabled });
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setVibrateMessage({ type: 'success', text: enabled ? 'Vibration alerts disabled' : 'Vibration alerts enabled' });
    } catch (error) {
      setVibrateMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update settings' });
    } finally {
      setVibrating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <HiBell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Vibration Alerts</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
              Vibrate this device when your turn is near or called.
            </p>
            {vibrateMessage.text && (
              <p className={`mt-2 text-xs font-medium ${
                vibrateMessage.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
              }`}>
                {vibrateMessage.text}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={vibrating}
          className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
            enabled ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700'
          }`}
          aria-label="Toggle vibration alerts"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
              enabled ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
      });
      setPhoneVerified(Boolean(user.phoneVerified));
      if (user.location) {
        setLocation(user.location);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleVerified = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setPhoneVerified(true);
    setMessage({ type: 'success', text: 'Phone verified successfully' });
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Geolocation is not supported by your browser' });
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          setLocation({
            latitude,
            longitude,
            address: data.display_name,
          });
          setMessage({ type: 'success', text: 'Location detected successfully' });
        } catch (error) {
          setMessage({ type: 'error', text: 'Failed to get address from coordinates' });
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        setDetecting(false);
        setMessage({ type: 'error', text: 'Failed to detect location. Please enable location access.' });
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await customerAPI.updateProfile({
        ...formData,
        location,
      });
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Profile
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your account settings
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <HiOutlineUser className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {user?.name}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Phone Number (for SMS/WhatsApp queue updates)
            </label>
            <PhoneVerifyPanel
              phone={formData.phone}
              onPhoneChange={(phone) => {
                setFormData((prev) => ({ ...prev, phone }));
                if (phone !== user?.phone) setPhoneVerified(false);
              }}
              verified={phoneVerified}
              onVerified={handleVerified}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Location
            </label>
            <div className="space-y-2">
              {location && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {location.address}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detecting}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                <HiOutlineLocationMarker className="w-4 h-4" />
                {detecting ? 'Detecting...' : 'Detect Location'}
              </button>
            </div>
          </div>

          {message.text && (
            <div className={`p-3 rounded-xl text-xs font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <HiOutlineCheck className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>

      <VibrationPreferenceCard />
      <PushNotificationCard />
    </motion.div>
  );
};

export default ProfilePage;
