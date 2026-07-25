import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { businessAPI } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { HiOutlineViewGrid, HiOutlineLocationMarker, HiOutlinePhone, HiOutlineMail, HiOutlineClock, HiOutlineRefresh } from 'react-icons/hi';

const categories = [
  { value: 'hospital', label: 'Hospital' }, { value: 'clinic', label: 'Clinic' },
  { value: 'salon', label: 'Salon' }, { value: 'restaurant', label: 'Restaurant' },
  { value: 'office', label: 'Office' }, { value: 'laboratory', label: 'Laboratory' },
];

export default function BusinessProfilePage() {
  const [form, setForm] = useState({
    name: '', description: '', category: '', address: '', phone: '', email: '', avgServiceTime: 5,
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
          name: b.name || '', description: b.description || '', category: b.category || '',
          address: b.address || '', phone: b.phone || '', email: b.email || '',
          avgServiceTime: b.avgServiceTime || 5,
          openTime: b.timeSlots?.open || '09:00', closeTime: b.timeSlots?.close || '17:00',
          interval: b.timeSlots?.interval || 30,
          tokenPrefix: b.queueSettings?.tokenPrefix || 'Q',
          maxDailyTokens: b.queueSettings?.maxDailyTokens || 100,
          autoAssignToken: b.queueSettings?.autoAssignToken !== false,
        });
        if (b.location?.coordinates?.[0] !== 0) setCoordinates({ lat: b.location.coordinates[1], lng: b.location.coordinates[0] });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFetchLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setCoordinates({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, { headers: { 'Accept-Language': 'en' } });
          const data = await res.json();
          if (data?.display_name) setForm(prev => ({ ...prev, address: data.display_name }));
        } catch { setForm(prev => ({ ...prev, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })); }
        setLocating(false);
      },
      () => { setError('Location access denied.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setMessage(''); setError(''); setSaving(true);
    try {
      const payload = {
        name: form.name, description: form.description, category: form.category,
        address: form.address, phone: form.phone, email: form.email,
        avgServiceTime: Number(form.avgServiceTime),
        timeSlots: { open: form.openTime, close: form.closeTime, interval: Number(form.interval) },
        queueSettings: { tokenPrefix: form.tokenPrefix, maxDailyTokens: Number(form.maxDailyTokens), autoAssignToken: form.autoAssignToken },
      };
      if (coordinates) payload.location = { type: 'Point', coordinates: [coordinates.lng, coordinates.lat] };
      await businessAPI.createOrUpdateProfile(payload);
      setMessage('Business profile saved');
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const Section = ({ title, children }) => (
    <div className="bg-white rounded-[20px] border border-slate-100 dark:bg-slate-800 dark:border-slate-700 p-6 card-shadow">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-5">{title}</h2>
      {children}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Business Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage your business details and hours.</p>
      </div>

      {message && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm p-4 rounded-xl">{message}</div>}
      {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Basic Information">
          <div className="space-y-5">
            <Input label="Business Name" placeholder="Your business name" icon={<HiOutlineViewGrid className="w-4 h-4" />} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
              <div className="grid grid-cols-3 gap-3">
                {categories.map(cat => (
                  <button type="button" key={cat.value} onClick={() => setForm({ ...form, category: cat.value })}
                    className={`p-3 rounded-xl border-2 text-center text-sm font-semibold transition-all ${
                      form.category === cat.value ? 'border-primary bg-primary-50 text-primary' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                    }`}>{cat.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                placeholder="Describe your business..." />
            </div>
          </div>
        </Section>

        <Section title="Contact & Location">
          <div className="space-y-5">
            <div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input label="Address" placeholder="123 Main St" icon={<HiOutlineLocationMarker className="w-4 h-4" />} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <button type="button" onClick={handleFetchLocation} disabled={locating}
                  className="mt-6 px-4 py-3 bg-primary-50 text-primary rounded-xl hover:bg-primary-100 transition-all text-sm font-semibold flex items-center gap-2 disabled:opacity-50 flex-shrink-0 h-12">
                  <HiOutlineRefresh className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
                  {locating ? '...' : 'Detect'}
                </button>
              </div>
              {coordinates && <p className="text-xs text-slate-400 mt-1">{coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</p>}
            </div>
            <div className="grid grid-cols-2 gap-5">
              <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" icon={<HiOutlinePhone className="w-4 h-4" />} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <Input label="Email" type="email" placeholder="business@example.com" icon={<HiOutlineMail className="w-4 h-4" />} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
        </Section>

        <Section title="Operating Hours">
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Open</label>
              <input type="time" value={form.openTime} onChange={e => setForm({ ...form, openTime: e.target.value })}
                className="w-full h-12 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Close</label>
              <input type="time" value={form.closeTime} onChange={e => setForm({ ...form, closeTime: e.target.value })}
                className="w-full h-12 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Interval (min)</label>
              <input type="number" min={5} step={5} value={form.interval} onChange={e => setForm({ ...form, interval: Number(e.target.value) })}
                className="w-full h-12 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Avg Service Time (min)</label>
            <input type="number" min={1} value={form.avgServiceTime} onChange={e => setForm({ ...form, avgServiceTime: Number(e.target.value) })}
              className="w-full h-12 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all max-w-[200px]" />
          </div>
        </Section>

        <Section title="Queue Settings">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Token Prefix</label>
              <input type="text" maxLength={5} value={form.tokenPrefix} onChange={e => setForm({ ...form, tokenPrefix: e.target.value })}
                className="w-full h-12 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">e.g. Q, T, #</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Max Daily Tokens</label>
              <input type="number" min={1} max={999} value={form.maxDailyTokens} onChange={e => setForm({ ...form, maxDailyTokens: Number(e.target.value) })}
                className="w-full h-12 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="autoAssignToken" checked={form.autoAssignToken} onChange={e => setForm({ ...form, autoAssignToken: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
            <label htmlFor="autoAssignToken" className="text-sm text-slate-700 dark:text-slate-300">Auto-assign token on booking</label>
          </div>
        </Section>

        <Button type="submit" variant="gradient" size="lg" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>
    </motion.div>
  );
}
