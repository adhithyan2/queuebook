import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { appointmentAPI } from '../../services/api';
import Badge from '../../components/ui/Badge';
import { HiOutlineCalendar, HiOutlineClock } from 'react-icons/hi';

const tabs = ['All', 'Upcoming', 'Completed', 'Cancelled'];

export default function CustomerAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');

  useEffect(() => {
    appointmentAPI.getAll()
      .then(res => setAppointments(res.data.appointments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === 'All'
    ? appointments
    : appointments.filter(a => a.status === tab.toLowerCase());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900">Appointments</h1>
        <p className="text-slate-500 mt-2">Manage your appointments and bookings.</p>
      </div>

      <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {filtered.length > 0 ? filtered.map((apt, i) => (
          <motion.div
            key={apt._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 card-shadow card-shadow-hover cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <HiOutlineCalendar className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-800 truncate">{apt.business?.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{apt.service}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-slate-400"><HiOutlineCalendar className="w-3.5 h-3.5" /> {new Date(apt.date).toLocaleDateString()}</span>
                <span className="flex items-center gap-1 text-xs text-slate-400"><HiOutlineClock className="w-3.5 h-3.5" /> {apt.timeSlot}</span>
                {apt.tokenNumber && (
                  <span className="text-xs font-bold text-indigo-600">Q{String(apt.tokenNumber).padStart(3, '0')}</span>
                )}
              </div>
            </div>
            <Badge variant={apt.status}>{apt.status}</Badge>
          </motion.div>
        )) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <HiOutlineCalendar className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">No {tab.toLowerCase()} appointments</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
