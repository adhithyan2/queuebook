import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { businessAPI } from '../../services/api';
import {
  HiOutlineBuildingStorefront, HiOutlineMapPin, HiOutlinePhone,
  HiOutlineClock, HiOutlineGlobeAlt, HiOutlineCheck, HiOutlinePhoto,
} from 'react-icons/hi2';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', phone: '', address: '', city: '',
    website: '', category: '', services: '',
    openingHours: dayNames.map(d => ({ day: d, open: '09:00', close: '17:00', closed: false })),
  });

  useEffect(() => {
    businessAPI.getProfile()
      .then(res => {
        const p = res.data.business || res.data;
        setProfile(p);
        setForm(prev => ({
          ...prev,
          name: p.name || '', description: p.description || '', phone: p.phone || '',
          address: p.address || '', city: p.city || '', website: p.website || '',
          category: p.category || '', services: Array.isArray(p.services)
            ? p.services.map(s => (typeof s === 'string' ? s : s.name)).join(', ')
            : '',
          openingHours: p.openingHours?.length ? p.openingHours : prev.openingHours,
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const updateHour = (index, key, val) => {
    setForm(prev => {
      const hours = [...prev.openingHours];
      hours[index] = { ...hours[index], [key]: val };
      return { ...prev, openingHours: hours };
    });
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false); setSaveError('');
    try {
      await businessAPI.createOrUpdateProfile({
        ...form,
        category: form.category.trim().toLowerCase(),
        services: form.services.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name })),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save. Please check the form and try again.');
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const inputClass = "w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Business Profile</h1>
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleSave} disabled={saving}
          className="h-10 px-6 rounded-xl gradient-primary text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-all">
          {saving ? 'Saving...' : saved ? <><HiOutlineCheck className="w-4 h-4" /> Saved</> : 'Save Changes'}
        </motion.button>
      </div>

      {saveError && (
        <div className="mb-5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3.5 rounded-xl">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-5">
              <HiOutlineBuildingStorefront className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">General Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Business Name</label>
                <input value={form.name} onChange={e => update('name', e.target.value)} className={inputClass} placeholder="Your business name" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3}
                  className={`${inputClass} h-auto py-3 resize-none`} placeholder="Describe your business" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Category</label>
                  <input value={form.category} onChange={e => update('category', e.target.value)} className={inputClass} placeholder="e.g. Salon, Clinic, Hospital" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Services (comma-separated)</label>
                  <input value={form.services} onChange={e => update('services', e.target.value)} className={inputClass} placeholder="Haircut, Shave, Styling" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-5">
              <HiOutlineMapPin className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Contact & Location</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Phone</label>
                  <input value={form.phone} onChange={e => update('phone', e.target.value)} className={inputClass} placeholder="+1 234 567 890" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Website</label>
                  <input value={form.website} onChange={e => update('website', e.target.value)} className={inputClass} placeholder="https://example.com" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Address</label>
                <input value={form.address} onChange={e => update('address', e.target.value)} className={inputClass} placeholder="123 Main Street" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">City</label>
                <input value={form.city} onChange={e => update('city', e.target.value)} className={inputClass} placeholder="New York" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-5">
              <HiOutlinePhoto className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Logo & Cover</h2>
            </div>
            <div className="w-full aspect-square rounded-xl bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors">
              <HiOutlinePhoto className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-400">Click to upload</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-5">
              <HiOutlineClock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Opening Hours</h2>
            </div>
            <div className="space-y-3">
              {form.openingHours.map((h, i) => (
                <div key={h.day} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 w-20 flex-shrink-0">{h.day.slice(0, 3)}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                    <input type="checkbox" checked={h.closed} onChange={e => updateHour(i, 'closed', e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-zinc-300 text-primary focus:ring-primary/20" />
                    <span className="text-[10px] text-zinc-400">Off</span>
                  </label>
                  {!h.closed && (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input type="time" value={h.open} onChange={e => updateHour(i, 'open', e.target.value)}
                        className="flex-1 h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-primary/20" />
                      <span className="text-[10px] text-zinc-400">to</span>
                      <input type="time" value={h.close} onChange={e => updateHour(i, 'close', e.target.value)}
                        className="flex-1 h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-primary/20" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
