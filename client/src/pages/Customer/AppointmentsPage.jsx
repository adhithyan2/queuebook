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

  const filtered = tab === 'All' ? appointments : appointments.filter(a => a.status === tab.toLowerCase());

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Appointments</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage your appointments and bookings.</p>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              tab === t ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-primary/30 hover:text-primary'
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length > 0 ? filtered.map((apt, i) => (
          <motion.div key={apt._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 card-shadow card-shadow-hover cursor-pointer">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <HiOutlineCalendar className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{apt.business?.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{apt.service}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500"><HiOutlineCalendar className="w-3 h-3" /> {new Date(apt.date).toLocaleDateString()}</span>
                <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500"><HiOutlineClock className="w-3 h-3" /> {apt.timeSlot}</span>
                {apt.tokenNumber && <span className="text-xs font-bold text-primary">Q{String(apt.tokenNumber).padStart(3, '0')}</span>}
              </div>
            </div>
            <Badge variant={apt.status}>{apt.status}</Badge>
          </motion.div>
        )) : (
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-16 text-center card-shadow">
            <HiOutlineCalendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No {tab.toLowerCase()} appointments</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
