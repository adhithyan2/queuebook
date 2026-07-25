import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { businessAPI } from '../../services/api';
import { HiOutlineChartBar, HiOutlineCheck, HiOutlineUsers, HiOutlineClock } from 'react-icons/hi';

export default function BusinessAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    businessAPI.getAnalytics()
      .then(res => setAnalytics(res.data.analytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const maxCount = analytics?.length > 0 ? Math.max(...analytics.map(d => d.count), 1) : 1;
  const totalCount = analytics?.reduce((s, d) => s + d.count, 0) || 0;
  const totalCompleted = analytics?.reduce((s, d) => s + (d.completed || 0), 0) || 0;
  const dailyAvg = analytics?.length > 0 ? Math.round(totalCount / analytics.length) : 0;
  const completionRate = totalCount > 0 ? Math.round((totalCompleted / totalCount) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Track your queue performance over time.</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Entries', value: totalCount, icon: HiOutlineUsers, color: 'text-primary', bg: 'bg-primary-50' },
          { label: 'Completed', value: totalCompleted, icon: HiOutlineCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Daily Avg', value: dailyAvg, icon: HiOutlineChartBar, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Completion Rate', value: `${completionRate}%`, icon: HiOutlineClock, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[20px] border border-slate-100 dark:bg-slate-900 dark:border-slate-800 p-5 card-shadow">
              <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white rounded-[20px] border border-slate-100 dark:bg-slate-900 dark:border-slate-800 p-6 card-shadow">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Daily Queue Volume (7 days)</h2>
        {analytics?.length > 0 ? (
          <div className="space-y-4">
            {analytics.slice(0, 7).map((day) => (
              <div key={day._id} className="flex items-center gap-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 w-24 flex-shrink-0 font-medium">
                  {new Date(day._id).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(day.count / maxCount) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full" />
                </div>
                <div className="text-right w-24 flex-shrink-0">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{day.count}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">({day.completed || 0} done)</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <HiOutlineChartBar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No analytics data yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Data will appear once customers start using your queue.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
