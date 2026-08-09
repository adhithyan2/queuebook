import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { businessAPI } from '../../services/api';
import {
  HiOutlineUsers, HiOutlineCheck, HiOutlineClock, HiOutlineStar,
  HiOutlineArrowTrendingUp, HiOutlineCalendarDays,
} from 'react-icons/hi2';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    businessAPI.getAnalytics()
      .then(res => setAnalytics(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const data = analytics || {};
  const kpis = [
    { label: 'Total Customers', value: data.totalCustomers || 0, icon: HiOutlineUsers, color: 'text-primary', bg: 'bg-primary/10', delta: '+12%' },
    { label: 'Completed', value: data.completedAppointments || 0, icon: HiOutlineCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', delta: '+8%' },
    { label: 'Avg Wait Time', value: `${data.avgWaitTime || 0}m`, icon: HiOutlineClock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', delta: '-2m' },
    { label: 'Avg Rating', value: (data.avgRating || 0).toFixed(1), icon: HiOutlineStar, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', delta: '+0.3' },
  ];

  const dailyData = data.dailyStats || [
    { day: 'Mon', count: 12 }, { day: 'Tue', count: 18 }, { day: 'Wed', count: 15 },
    { day: 'Thu', count: 22 }, { day: 'Fri', count: 28 }, { day: 'Sat', count: 32 }, { day: 'Sun', count: 20 },
  ];
  const maxCount = Math.max(...dailyData.map(d => d.count), 1);

  const topServices = data.topServices || [
    { name: 'Haircut', count: 45 }, { name: 'Shave', count: 30 }, { name: 'Beard Trim', count: 25 },
    { name: 'Coloring', count: 15 }, { name: 'Styling', count: 10 },
  ];
  const maxService = Math.max(...topServices.map(s => s.count), 1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Analytics</h1>
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <HiOutlineCalendarDays className="w-4 h-4" />
          <span>Last 7 days</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <HiOutlineArrowTrendingUp className="w-3 h-3" /> {kpi.delta}
              </span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{kpi.value}</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-5">Daily Appointments</h2>
          <div className="flex items-end gap-3 h-48">
            {dailyData.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <motion.div initial={{ height: 0 }} animate={{ height: `${(d.count / maxCount) * 100}%` }}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                  className="w-full rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors relative group cursor-pointer"
                  style={{ minHeight: 4 }}>
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {d.count} appointments
                  </div>
                  <div className="absolute inset-0 rounded-lg bg-primary" style={{ height: '100%', opacity: 0.8 }} />
                </motion.div>
                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-5">Top Services</h2>
          <div className="space-y-4">
            {topServices.map((s, i) => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{s.name}</span>
                  <span className="text-[11px] font-semibold text-zinc-500">{s.count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(s.count / maxService) * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
