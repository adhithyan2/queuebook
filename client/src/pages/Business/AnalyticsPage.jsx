import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { businessAPI } from '../../services/api';
import {
  HiOutlineUsers, HiOutlineCheck, HiOutlineClock,
  HiOutlineArrowTrendingUp, HiOutlineCalendarDays,
  HiOutlineFire, HiOutlineSignal, HiOutlineSparkles,
} from 'react-icons/hi2';
import { HourlyCrowdBars, CrowdLegend, SourceNote } from '../../components/crowd/CrowdTiming';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState([]);
  const [crowd, setCrowd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [crowdLoading, setCrowdLoading] = useState(true);

  useEffect(() => {
    businessAPI.getAnalytics()
      .then(res => setAnalytics(res.data.analytics || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    businessAPI.getCrowdAnalytics()
      .then(res => setCrowd(res.data))
      .catch(() => {})
      .finally(() => setCrowdLoading(false));
  }, []);

  if (loading || crowdLoading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const totalCustomers = analytics.reduce((s, d) => s + (d.count || 0), 0);
  const completed = analytics.reduce((s, d) => s + (d.completed || 0), 0);

  const dailyData = analytics.map(d => ({
    day: new Date(d._id).toLocaleDateString('en-US', { weekday: 'short' }),
    count: d.count || 0,
  }));
  const maxCount = Math.max(...dailyData.map(d => d.count), 1);

  const kpis = [
    { label: 'Total Customers', value: totalCustomers, icon: HiOutlineUsers, color: 'text-primary', bg: 'bg-primary/10', delta: '7 days' },
    { label: 'Completed', value: completed, icon: HiOutlineCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', delta: `${completed} total` },
    { label: 'Days Active', value: analytics.length, icon: HiOutlineCalendarDays, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', delta: 'last week' },
    { label: 'Avg Daily', value: analytics.length ? Math.round(totalCustomers / analytics.length) : 0, icon: HiOutlineArrowTrendingUp, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', delta: 'customers' },
  ];

  const maxDailyRel = Math.max(...(crowd?.daily || []).map((d) => d.relative || 0), 0.01);

  const crowdKpis = [
    { label: 'Peak Hour', value: crowd?.peakHour?.label || '—', sub: crowd?.peakHour?.level ? `${crowd.peakHour.level} crowd` : '', icon: HiOutlineFire, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
    { label: 'Lowest Crowd Hour', value: crowd?.lowestHour?.label || '—', sub: crowd?.lowestHour?.level ? `${crowd.lowestHour.level} crowd` : '', icon: HiOutlineSignal, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Busiest Day', value: crowd?.busiestDay?.label || '—', sub: 'highest volume', icon: HiOutlineArrowTrendingUp, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    { label: 'Avg Queue Size', value: crowd?.avgQueueSize ?? '—', sub: `~${crowd?.avgWait ?? '—'} min avg wait`, icon: HiOutlineUsers, color: 'text-primary', bg: 'bg-primary/10' },
  ];

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

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 mb-6">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-5">Daily Appointments</h2>
        {dailyData.length > 0 ? (
          <div className="flex items-end gap-3 h-48">
            {dailyData.map((d, i) => (
              <div key={d.day + i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div initial={{ height: 0 }} animate={{ height: `${(d.count / maxCount) * 100}%` }}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                  className="w-full rounded-lg bg-gradient-to-t from-primary to-indigo-500 group-hover:opacity-80 transition-opacity relative cursor-pointer"
                  style={{ minHeight: 4 }}>
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {d.count} appointments
                  </div>
                </motion.div>
                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">{d.day}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <HiOutlineClock className="w-8 h-8 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No queue activity in the last 7 days</p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <HiOutlineSparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Crowd Analytics — QueueBook Smart Timing</h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Hourly crowd levels, busy hours &amp; expected load (last 30 days)</p>
            </div>
          </div>
          <SourceNote source={crowd?.source} />
        </div>

        {crowd ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {crowdKpis.map((kpi, i) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                      <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                    </div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{kpi.label}</span>
                  </div>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{kpi.value}</p>
                  {kpi.sub && <p className="text-[10px] text-zinc-400 dark:text-zinc-500 capitalize">{kpi.sub}</p>}
                </motion.div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3">Hourly Crowd Level</h3>
              <HourlyCrowdBars hourly={crowd.hourly} height="h-40" />
              <div className="mt-3">
                <CrowdLegend />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3">Busy vs Quiet Days</h3>
              <div className="flex items-end gap-3 h-28">
                {(crowd.daily || []).map((d, i) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(6, ((d.relative || 0) / maxDailyRel) * 100)}%` }}
                      transition={{ delay: 0.1 + i * 0.04, duration: 0.4, ease: 'easeOut' }}
                      className={`w-full rounded-lg ${d.day === crowd.busiestDay?.day ? 'bg-gradient-to-t from-primary to-indigo-500' : d.day === crowd.leastBusyDay?.day ? 'bg-emerald-400/80' : 'bg-primary/25'}`}
                    />
                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <HiOutlineClock className="w-8 h-8 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Not enough data yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
