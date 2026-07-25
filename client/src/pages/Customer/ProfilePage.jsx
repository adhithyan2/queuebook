import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { customerAPI } from '../../services/api';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineRefresh, HiOutlineShieldCheck } from 'react-icons/hi';

export default function CustomerProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', location: user?.location || '' });
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', location: user.location || '' });
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault(); setMessage(''); setError(''); setSaving(true);
    try {
      const res = await customerAPI.updateProfile({ name: form.name, phone: form.phone, location: form.location });
      setUser(res.data.user); setMessage('Profile updated successfully');
    } catch (err) { setError(err.response?.data?.message || 'Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, { headers: { 'Accept-Language': 'en' } });
          const data = await res.json();
          if (data?.display_name) setForm(prev => ({ ...prev, location: data.display_name }));
        } catch { setForm(prev => ({ ...prev, location: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })); }
        setLocating(false);
      },
      () => { setError('Location access denied. Please enable location services.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your personal information and preferences.</p>
      </div>

      {message && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm p-4 rounded-xl mb-6">{message}</motion.div>}
      {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl mb-6">{error}</motion.div>}

      <form onSubmit={handleSave}>
        <div className="bg-white rounded-[20px] border border-slate-100 p-8 card-shadow">
          <div className="flex items-center gap-5 mb-8 pb-6 border-b border-slate-100">
            <Avatar name={user?.name} size="xl" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <HiOutlineShieldCheck className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary capitalize">{user?.role || 'Customer'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} icon={<HiOutlineUser className="w-4 h-4" />} />
              <Input label="Email" type="email" value={form.email} disabled icon={<HiOutlineMail className="w-4 h-4" />} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="Phone" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} icon={<HiOutlinePhone className="w-4 h-4" />} />
              <div>
                <Input label="Location" placeholder="City, State" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} icon={<HiOutlineLocationMarker className="w-4 h-4" />} />
                <button type="button" onClick={handleDetectLocation} disabled={locating}
                  className="mt-2 px-4 py-2 bg-primary-50 text-primary rounded-xl hover:bg-primary-100 transition-all text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                  <HiOutlineRefresh className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
                  {locating ? 'Detecting...' : 'Detect my location'}
                </button>
              </div>
            </div>
            <div className="pt-2">
              <Button type="submit" variant="gradient" fullWidth disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
