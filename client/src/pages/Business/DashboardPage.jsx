import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { businessAPI } from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { HiOutlineUsers, HiOutlineCheck, HiOutlineClock, HiOutlineXCircle, HiOutlineStar, HiOutlineArrowRight } from 'react-icons/hi';

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
      await businessAPI.callNext();
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
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const { queue = [], stats = {}, business } = dashboard || {};

  const statCards = [
    { label: 'Today\'s Queue', value: stats.total || 0, sub: `${stats.waiting || 0} waiting`, color: 'text-primary', icon: HiOutlineUsers, bg: 'bg-primary-50' },
    { label: 'Completed', value: stats.completed || 0, sub: 'served today', color: 'text-emerald-600', icon: HiOutlineCheck, bg: 'bg-emerald-50' },
    { label: 'Avg Wait', value: business?.avgServiceTime ? `${business.avgServiceTime}m` : '—', sub: 'per customer', color: 'text-amber-600', icon: HiOutlineClock, bg: 'bg-amber-50' },
    { label: 'Skipped', value: stats.skipped || 0, sub: 'today', color: 'text-red-600', icon: HiOutlineXCircle, bg: 'bg-red-50' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{business?.name || 'Business Dashboard'}</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your queue and customer flow.</p>
        </div>
        <Button variant="gradient" onClick={handleCallNext} disabled={!queue.some(q => q.status === 'waiting')}>
          Call Next
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[20px] border border-slate-100 p-6 card-shadow"
            >
              <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
              <span className={`text-xs font-medium ${s.color} mt-1 block`}>{s.sub}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Today's Queue Table */}
      <div className="bg-white rounded-[20px] border border-slate-100 p-6 card-shadow mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Today's Queue</h2>
          <span className="text-xs text-slate-400 font-medium">{queue.length} entries</span>
        </div>

        {queue.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-400 pb-3 uppercase tracking-wider">Token</th>
                  <th className="text-left text-xs font-medium text-slate-400 pb-3 uppercase tracking-wider">Customer</th>
                  <th className="text-left text-xs font-medium text-slate-400 pb-3 uppercase tracking-wider">Status</th>
                  <th className="text-right text-xs font-medium text-slate-400 pb-3 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item, i) => (
                  <motion.tr
                    key={item._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3.5 text-sm font-bold text-slate-800">Q{String(item.tokenNumber).padStart(3, '0')}</td>
                    <td className="py-3.5 text-sm text-slate-700">{item.user?.name || 'Unknown'}</td>
                    <td className="py-3.5"><Badge variant={item.status === 'called' ? 'confirmed' : item.status === 'completed' ? 'active' : item.status === 'skipped' ? 'cancelled' : 'pending'}>{item.status}</Badge></td>
                    <td className="py-3.5 text-right">
                      {item.status === 'waiting' && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleComplete(item._id)} className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all">Done</button>
                          <button onClick={() => handleSkip(item._id)} className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-all">Skip</button>
                        </div>
                      )}
                      {item.status === 'called' && (
                        <button onClick={() => handleComplete(item._id)} className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all">Complete</button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <HiOutlineUsers className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No queue entries today</p>
          </div>
        )}
      </div>

      {/* Analytics + Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[20px] border border-slate-100 p-6 card-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-5">Queue Analytics (7 days)</h2>
          {analytics?.analytics?.length > 0 ? (
            <div className="space-y-3">
              {analytics.analytics.slice(0, 7).map((day) => (
                <div key={day._id} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-20 flex-shrink-0 font-medium">{new Date(day._id).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((day.count / Math.max(...analytics.analytics.map(d => d.count), 1)) * 100, 100)}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-8 text-right">{day.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-10">No data available yet</p>
          )}
        </div>

        <div className="bg-white rounded-[20px] border border-slate-100 p-6 card-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-5">Recent Reviews</h2>
          {reviews.length > 0 ? reviews.slice(0, 4).map((r) => (
            <div key={r._id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                {r.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-slate-700">{r.user?.name}</p>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <HiOutlineStar key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-500">{r.comment || 'No comment'}</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-10">
              <HiOutlineStar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No reviews yet</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
