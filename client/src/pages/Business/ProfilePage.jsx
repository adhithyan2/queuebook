import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { businessAPI } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import {
  HiOutlineViewGrid, HiOutlineLocationMarker, HiOutlinePhone,
  HiOutlineMail, HiOutlineClock, HiOutlineRefresh
} from 'react-icons/hi';

const categories = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'salon', label: 'Salon' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'office', label: 'Office' },
  { value: 'laboratory', label: 'Laboratory' },
];

export default function BusinessProfilePage() {
  const [form, setForm] = useState({
    name: '', description: '', category: '', address: '',
    phone: '', email: '', avgServiceTime: 5,
    openTime: '09:00', closeTime: '17:00', interval: 30,
    tokenPrefix: 'Q', maxDailyTokens: 100, autoAssignToken: true,
  });
  const [coordinates, setCoordinates] = useState(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    businessAPI.getProfile()
      .then(res => {
        const b = res.data.business;
        setForm({
          name: b.name || '',
          description: b.description || '',
          category: b.category || '',
          address: b.address || '',
          phone: b.phone || '',
          email: b.email || '',
          avgServiceTime: b.avgServiceTime || 5,
          openTime: b.timeSlots?.open || '09:00',
          closeTime: b.timeSlots?.close || '17:00',
          interval: b.timeSlots?.interval || 30,
          tokenPrefix: b.queueSettings?.tokenPrefix || 'Q',
          maxDailyTokens: b.queueSettings?.maxDailyTokens || 100,
          autoAssignToken: b.queueSettings?.autoAssignToken !== false,
        });
        if (b.location?.coordinates?.[0] !== 0) {
          setCoordinates({ lat: b.location.coordinates[1], lng: b.location.coordinates[0] });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoordinates({ lat, lng });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          if (data?.display_name) {
            setForm(prev => ({ ...prev, address: data.display_name }));
          }
        } catch {
          setForm(prev => ({ ...prev, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
        }
        setLocating(false);
      },
      () => {
        setError('Location access denied. Please enable location services.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        address: form.address,
        phone: form.phone,
        email: form.email,
        avgServiceTime: Number(form.avgServiceTime),
        timeSlots: {
          open: form.openTime,
          close: form.closeTime,
          interval: Number(form.interval),
        },
        queueSettings: {
          tokenPrefix: form.tokenPrefix,
          maxDailyTokens: Number(form.maxDailyTokens),
          autoAssignToken: form.autoAssignToken,
        },
      };
      if (coordinates) {
        payload.location = { type: 'Point', coordinates: [coordinates.lng, coordinates.lat] };
      }
      await businessAPI.createOrUpdateProfile(payload);
      setMessage('Business profile saved');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="mb-10">
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">Business Profile</h1>
        <p className="text-slate-500 mt-2.5">Manage your business details and hours</p>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm p-4 rounded-xl mb-6">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10 max-w-2xl">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Basic Information</h2>
          <div className="space-y-6">
            <Input label="Business Name" placeholder="Your business name" icon={<HiOutlineViewGrid className="w-4 h-4" />} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <div className="grid grid-cols-3 gap-3">
                {categories.map(cat => (
                  <button type="button" key={cat.value} onClick={() => setForm({ ...form, category: cat.value })}
                    className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${
                      form.category === cat.value ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>{cat.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                placeholder="Describe your business..." />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Contact & Location</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Input label="Address" placeholder="123 Main St" icon={<HiOutlineLocationMarker className="w-4 h-4" />} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="flex-1" />
                <button type="button" onClick={handleFetchLocation} disabled={locating}
                  className="mt-6 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all text-sm font-medium flex items-center gap-2 disabled:opacity-50 flex-shrink-0">
                  <HiOutlineRefresh className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
                  {locating ? 'Detecting...' : 'Fetch Location'}
                </button>
              </div>
              {coordinates && (
                <p className="text-xs text-slate-400 mt-1">
                  {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                </p>
              )}
            </div>
            <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" icon={<HiOutlinePhone className="w-4 h-4" />} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Input label="Email" type="email" placeholder="business@example.com" icon={<HiOutlineMail className="w-4 h-4" />} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Operating Hours</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Open</label>
              <input type="time" value={form.openTime} onChange={e => setForm({ ...form, openTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Close</label>
              <input type="time" value={form.closeTime} onChange={e => setForm({ ...form, closeTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Interval (min)</label>
              <input type="number" min={5} step={5} value={form.interval} onChange={e => setForm({ ...form, interval: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
            </div>
          </div>
          <div className="mt-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Avg Service Time (min)</label>
            <input type="number" min={1} value={form.avgServiceTime} onChange={e => setForm({ ...form, avgServiceTime: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all max-w-[200px]" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Queue Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Token Prefix</label>
              <input type="text" maxLength={5} value={form.tokenPrefix} onChange={e => setForm({ ...form, tokenPrefix: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
              <p className="text-xs text-slate-400 mt-1">e.g. Q, T, #</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Max Daily Tokens</label>
              <input type="number" min={1} max={999} value={form.maxDailyTokens} onChange={e => setForm({ ...form, maxDailyTokens: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <input type="checkbox" id="autoAssignToken" checked={form.autoAssignToken} onChange={e => setForm({ ...form, autoAssignToken: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <label htmlFor="autoAssignToken" className="text-sm text-slate-700">Auto-assign token on booking</label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" variant="gradient" size="lg" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
