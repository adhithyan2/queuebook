import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi';

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', location: user?.location || '' });

  const stats = [
    { label: 'Appointments', value: '12' },
    { label: 'Queue Visits', value: '28' },
    { label: 'Reviews', value: '5' },
    { label: 'Saved Time', value: '4.5h' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto px-4 sm:px-0">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500 mt-2">Manage your personal information and preferences.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
        <div className="flex items-center gap-6 mb-10">
          <Avatar name={user?.name} size="xl" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg capitalize">
              {user?.role || 'User'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {stats.map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-2xl p-5 text-center">
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} icon={<HiOutlineUser className="w-4 h-4" />} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} icon={<HiOutlineMail className="w-4 h-4" />} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="Phone" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} icon={<HiOutlinePhone className="w-4 h-4" />} />
            <Input label="Location" placeholder="City, State" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} icon={<HiOutlineLocationMarker className="w-4 h-4" />} />
          </div>
          <div className="pt-2">
            <Button variant="gradient">Save Changes</Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
