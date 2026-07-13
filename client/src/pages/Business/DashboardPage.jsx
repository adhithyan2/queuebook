import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { businessAPI, customerAPI } from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { HiOutlineUsers, HiOutlineCheck, HiOutlineClock, HiOutlineXCircle, HiOutlineStar } from 'react-icons/hi';

export default function BusinessDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      businessAPI.getDashboard(),
      businessAPI.getAnalytics(),
    ]).then(([dashRes, analyticsRes]) => {
      setDashboard(dashRes.data);
      setAnalytics(analyticsRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCallNext = async () => {
    try {
      const res = await businessAPI.callNext();
      const updated = await businessAPI.getDashboard();
      setDashboard(updated.data);
    } catch (err) {
      alert(err.response?.data?.message || 'No one in queue');
    }
  };

  const handleSkip = async (id) => {
    try {
      await businessAPI.skipCustomer(id);
      const updated = await businessAPI.getDashboard();
      setDashboard(updated.data);
    } catch {}
  };

  const handleComplete = async (id) => {
    try {
      await businessAPI.completeAppointment(id);
      const updated = await businessAPI.getDashboard();
      setDashboard(updated.data);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const { queue = [], stats = {}, business } = dashboard || {};

  const statCards = [
    { label: 'Today\'s Queue', value: stats.total || 0, change: `${stats.waiting || 0} waiting`, color: 'text-indigo-600', icon: HiOutlineUsers },
    { label: 'Completed', value: stats.completed || 0, change: 'served today', color: 'text-emerald-600', icon: HiOutlineCheck },
    { label: 'Avg Wait Time', value: business?.avgServiceTime ? `${business.avgServiceTime} min` : '—', change: 'per customer', color: 'text-amber-600', icon: HiOutlineClock },
    { label: 'Skipped', value: stats.skipped || 0, change: 'today', color: 'text-red-600', icon: HiOutlineXCircle },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">{business?.name || 'Business Dashboard'}</h1>
          <p className="text-slate-500 mt-2.5">Manage your queue and customer flow.</p>
        </div>
        <Button variant="gradient" onClick={handleCallNext} disabled={!queue.some(q => q.status === 'waiting')}>
          Call Next
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow min-h-[160px] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
              <span className={`text-xs font-medium ${s.color}`}>{s.change}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Today's Queue */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Today's Queue</h2>
          <span className="text-xs text-slate-400">{queue.length} entries</span>
        </div>

        {queue.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-400 pb-4">Token</th>
                  <th className="text-left text-xs font-medium text-slate-400 pb-4">Customer</th>
                  <th className="text-left text-xs font-medium text-slate-400 pb-4">Status</th>
                  <th className="text-right text-xs font-medium text-slate-400 pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item, i) => (
                  <motion.tr
                    key={item._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-4 text-sm font-bold text-slate-800">Q{String(item.tokenNumber).padStart(3, '0')}</td>
                    <td className="py-4 text-sm text-slate-700">{item.user?.name || 'Unknown'}</td>
                    <td className="py-4"><Badge variant={item.status === 'called' ? 'confirmed' : item.status === 'completed' ? 'active' : item.status === 'skipped' ? 'cancelled' : 'pending'}>{item.status}</Badge></td>
                    <td className="py-4 text-right">
                      {item.status === 'waiting' && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleComplete(item._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Complete">
                            <HiOutlineCheck className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleSkip(item._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Skip">
                            <HiOutlineXCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {item.status === 'called' && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleComplete(item._id)} className="px-3 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all">Complete</button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <HiOutlineUsers className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">No queue entries today</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Analytics */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Queue Analytics (7 days)</h2>
          {analytics?.analytics?.length > 0 ? (
            <div className="space-y-3">
              {analytics.analytics.slice(0, 7).map((day) => (
                <div key={day._id} className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 w-20 flex-shrink-0">{new Date(day._id).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((day.count / Math.max(...analytics.analytics.map(d => d.count), 1)) * 100, 100)}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-indigo-500 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 w-8 text-right">{day.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No data available yet</p>
          )}
        </div>

        {/* Reviews Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Recent Reviews</h2>
          {reviews.length > 0 ? reviews.slice(0, 4).map((r) => (
            <div key={r._id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-0.5 text-amber-400 flex-shrink-0 mt-0.5">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <HiOutlineStar key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700">{r.user?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.comment || 'No comment'}</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <HiOutlineStar className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">No reviews yet</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
