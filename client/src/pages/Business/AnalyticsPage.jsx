import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { businessAPI } from '../../services/api';
import { HiOutlineChartBar } from 'react-icons/hi';

export default function BusinessAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    businessAPI.getAnalytics()
      .then(res => setAnalytics(res.data.analytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const maxCount = analytics?.length > 0 ? Math.max(...analytics.map(d => d.count), 1) : 1;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-2">Track your queue performance over time.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Daily Queue Volume (7 days)</h2>
        {analytics?.length > 0 ? (
          <>
            <div className="space-y-4">
              {analytics.slice(0, 7).map((day) => (
                <div key={day._id} className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 w-24 flex-shrink-0">
                    {new Date(day._id).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(day.count / maxCount) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    />
                  </div>
                  <div className="text-right w-20 flex-shrink-0">
                    <span className="text-sm font-semibold text-slate-700">{day.count}</span>
                    <span className="text-xs text-slate-400 ml-1">({day.completed || 0} done)</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-indigo-600">{analytics.reduce((s, d) => s + d.count, 0)}</p>
                  <p className="text-xs text-slate-500 mt-1">Total Entries</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{analytics.reduce((s, d) => s + (d.completed || 0), 0)}</p>
                  <p className="text-xs text-slate-500 mt-1">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    {analytics.length > 0 ? Math.round(analytics.reduce((s, d) => s + d.count, 0) / analytics.length) : 0}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Daily Avg</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {analytics.reduce((s, d) => s + d.count, 0) > 0
                      ? Math.round((analytics.reduce((s, d) => s + (d.completed || 0), 0) / analytics.reduce((s, d) => s + d.count, 0)) * 100) + '%'
                      : '—'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Completion Rate</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <HiOutlineChartBar className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">No analytics data yet</p>
            <p className="text-xs text-slate-400 mt-1">Data will appear once customers start using your queue.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
