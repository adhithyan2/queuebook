import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { businessAPI, customerAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlinePlay, HiOutlinePause, HiOutlineCheck, HiOutlineXMark,
  HiOutlinePlus, HiOutlineUsers, HiOutlineClock, HiOutlineStar,
  HiOutlineArrowPath, HiOutlineMegaphone,
  HiOutlineUser, HiOutlineCalendar, HiOutlineBell,
} from 'react-icons/hi2';

function useTimer(isRunning) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);
  useEffect(() => {
    if (isRunning) {
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
      setSeconds(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function BusinessDashboardPage() {
  const socket = useSocket();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [adding, setAdding] = useState(false);
  const [queuePaused, setQueuePaused] = useState(false);

  const loadDashboard = () => {
    Promise.all([
      businessAPI.getDashboard(),
      businessAPI.getAnalytics(),
    ]).then(([dashRes, analyticsRes]) => {
      setDashboard(dashRes.data);
      setAnalytics(analyticsRes.data);
      if (dashRes.data.business?._id) {
        customerAPI.getReviews(dashRes.data.business._id)
          .then(r => setReviews(r.data.reviews || []))
          .catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadDashboard(); }, []);

  useEffect(() => {
    if (!socket || !dashboard?.business?._id) return;
    socket.emit('join-business-room', dashboard.business._id);
    const handleRefresh = () => loadDashboard();
    socket.on('queue-refresh', handleRefresh);
    socket.on('booking-notification', handleRefresh);
    return () => { socket.off('queue-refresh', handleRefresh); socket.off('booking-notification', handleRefresh); };
  }, [socket, dashboard?.business?._id]);

  const refreshDashboard = async () => {
    try { const res = await businessAPI.getDashboard(); setDashboard(res.data); } catch {}
  };

  const handleCallNext = async () => {
    try { await businessAPI.callNext(); await refreshDashboard(); } catch (err) { alert(err.response?.data?.message || 'No one in queue'); }
  };
  const handleSkip = async (id) => {
    try { await businessAPI.skipCustomer(id); await refreshDashboard(); } catch {}
  };
  const handleComplete = async (id) => {
    try { await businessAPI.completeAppointment(id); await refreshDashboard(); } catch {}
  };
  const handleAddWalkIn = async () => {
    if (!walkInName.trim()) return;
    setAdding(true);
    try { await businessAPI.addWalkIn({ name: walkInName.trim() }); setWalkInName(''); setShowWalkIn(false); await refreshDashboard(); } catch {}
    setAdding(false);
  };

  const { queue = [], stats = {}, business } = dashboard || {};
  const called = queue.find(q => q.status === 'called');
  const isServing = !!called;
  const timer = useTimer(isServing);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#6D5EF7]/20 border-t-[#6D5EF7] rounded-full animate-spin" />
      </div>
    );
  }

  const waiting = queue.filter(q => q.status === 'waiting');
  const completed = queue.filter(q => q.status === 'completed');
  const skipped = queue.filter(q => q.status === 'skipped');
  const avgServiceTime = business?.avgServiceTime || 5;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

      {/* ─── Header ─── */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111827] dark:text-slate-100">{business?.name || 'Dashboard'}</h1>
            <p className="text-[#6B7280] dark:text-slate-400 text-sm mt-0.5">Live queue management</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${queuePaused ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
            <span className={`w-2 h-2 rounded-full ${queuePaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
            {queuePaused ? 'Paused' : 'Open'}
          </div>
        </div>
      </motion.div>

      {/* ─── Top Row: Current Serving + Stats ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Current Serving — spans 2 cols */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[20px] p-8 relative overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#6D5EF7]/8 to-transparent rounded-bl-[80px] pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isServing ? 'bg-[#6D5EF7] animate-pulse' : 'bg-[#D1D5DB]'}`} />
                <h2 className="text-sm font-bold text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Currently Serving</h2>
              </div>
              {isServing && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#6D5EF7]/10 text-[#6D5EF7] font-mono text-lg font-bold">
                  <HiOutlineClock className="w-4 h-4" />
                  {timer}
                </div>
              )}
            </div>

            {called ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-20 h-20 rounded-[20px] flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6D5EF7, #A78BFA)' }}>
                  Q{String(called.tokenNumber).padStart(3, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-bold text-[#111827] dark:text-slate-100 truncate">{called.user?.name || called.walkInName || 'Unknown'}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[#6B7280] dark:text-slate-400">
                    {called.service && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6D5EF7]" />
                        {called.service}
                      </span>
                    )}
                    {called.timeSlot && (
                      <span className="flex items-center gap-1.5">
                        <HiOutlineCalendar className="w-3.5 h-3.5" />
                        {called.timeSlot}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => handleComplete(called._id)}
                    className="h-12 px-6 rounded-xl text-white text-sm font-bold flex items-center gap-2 transition-all" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                    <HiOutlineCheck className="w-5 h-5" /> Complete
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => handleSkip(called._id)}
                    className="h-12 px-6 rounded-xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 text-sm font-bold flex items-center gap-2 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
                    <HiOutlineXMark className="w-5 h-5" /> Skip
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-[#F3F4F6] dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <HiOutlineUsers className="w-7 h-7 text-[#9CA3AF]" />
                </div>
                <p className="text-[#6B7280] dark:text-slate-400 text-sm font-medium">No customer currently being served</p>
                <p className="text-[#9CA3AF] dark:text-slate-500 text-xs mt-1">Click "Call Next" to serve the next customer</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="flex flex-col gap-4">
          {[
            { label: 'Waiting', value: waiting.length, color: '#F59E0B', bg: '#FEF3C7', icon: HiOutlineUsers },
            { label: 'Completed', value: completed.length, color: '#10B981', bg: '#D1FAE5', icon: HiOutlineCheck },
            { label: 'Skipped', value: skipped.length, color: '#EF4444', bg: '#FEE2E2', icon: HiOutlineXMark },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-[20px] p-5 flex items-center gap-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.bg}` }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#111827] dark:text-slate-100">{s.value}</p>
                  <p className="text-xs font-medium text-[#6B7280] dark:text-slate-400">{s.label}</p>
                </div>
              </motion.div>
            );
          })}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] p-5 flex items-center gap-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#EDE9FE]">
              <HiOutlineClock className="w-5 h-5 text-[#6D5EF7]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827] dark:text-slate-100">{avgServiceTime}m</p>
              <p className="text-xs font-medium text-[#6B7280] dark:text-slate-400">Avg Wait</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Action Bar ─── */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 rounded-[20px] p-6 mb-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}>
        <div className="flex flex-wrap gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCallNext} disabled={waiting.length === 0}
            className="h-12 px-6 rounded-xl text-white text-sm font-bold flex items-center gap-2.5 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            style={{ background: waiting.length > 0 ? 'linear-gradient(135deg, #6D5EF7, #A78BFA)' : '#D1D5DB' }}>
            <HiOutlineMegaphone className="w-5 h-5" /> Call Next
          </motion.button>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { if (called) handleCallNext(); }} disabled={!isServing}
            className="h-12 px-5 rounded-xl text-sm font-bold flex items-center gap-2 border border-[#E5E7EB] dark:border-slate-700 text-[#6B7280] dark:text-slate-400 hover:bg-[#F9FAFB] dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <HiOutlineArrowPath className="w-4 h-4" /> Recall
          </motion.button>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setQueuePaused(p => !p)}
            className={`h-12 px-5 rounded-xl text-sm font-bold flex items-center gap-2 border transition-all ${
              queuePaused
                ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border-[#E5E7EB] dark:border-slate-700 text-[#6B7280] dark:text-slate-400 hover:bg-[#F9FAFB] dark:hover:bg-slate-800'
            }`}>
            {queuePaused ? <><HiOutlinePlay className="w-4 h-4" /> Resume Queue</> : <><HiOutlinePause className="w-4 h-4" /> Pause Queue</>}
          </motion.button>

          <div className="flex-1" />

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowWalkIn(true)}
            className="h-12 px-5 rounded-xl text-sm font-bold flex items-center gap-2 border border-[#E5E7EB] dark:border-slate-700 text-[#6B7280] dark:text-slate-400 hover:bg-[#F9FAFB] dark:hover:bg-slate-800 transition-all">
            <HiOutlinePlus className="w-4 h-4" /> Walk-in
          </motion.button>
        </div>
      </motion.div>

      {/* ─── Waiting Queue Table ─── */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="bg-white dark:bg-slate-900 rounded-[20px] p-8 mb-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#111827] dark:text-slate-100">Waiting Queue</h2>
          <span className="text-xs font-semibold text-[#6B7280] dark:text-slate-400 bg-[#F3F4F6] dark:bg-slate-800 px-3 py-1.5 rounded-full">{waiting.length} customers</span>
        </div>

        {waiting.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F3F4F6] dark:border-slate-800">
                  {['Token', 'Customer', 'Service', 'Time', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`text-left text-[11px] font-bold text-[#9CA3AF] dark:text-slate-500 pb-4 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {waiting.map((item, i) => (
                  <motion.tr key={item._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-[#F9FAFB] dark:border-slate-800/50 last:border-0 hover:bg-[#FAFBFC] dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4">
                      <span className="inline-flex items-center justify-center w-14 h-8 rounded-lg bg-[#6D5EF7]/10 text-[#6D5EF7] text-xs font-bold">
                        Q{String(item.tokenNumber).padStart(3, '0')}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F3F4F6] dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-[#6B7280] dark:text-slate-400">
                          {(item.user?.name || item.walkInName || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-[#111827] dark:text-slate-200">{item.user?.name || item.walkInName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-[#6B7280] dark:text-slate-400">{item.service || '—'}</td>
                    <td className="py-4 text-sm text-[#6B7280] dark:text-slate-400 font-mono">{item.timeSlot || '—'}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#B45309]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                        Waiting
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleComplete(item._id)}
                          className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all">
                          Done
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleSkip(item._id)}
                          className="px-3.5 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
                          Skip
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-[#F3F4F6] dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <HiOutlineUsers className="w-6 h-6 text-[#D1D5DB]" />
            </div>
            <p className="text-sm font-semibold text-[#6B7280] dark:text-slate-400">Queue is empty</p>
            <p className="text-xs text-[#9CA3AF] dark:text-slate-500 mt-1">New customers will appear here when they join</p>
          </div>
        )}

        {/* Completed & Skipped collapsed */}
        {(completed.length > 0 || skipped.length > 0) && (
          <div className="mt-4 pt-4 border-t border-[#F3F4F6] dark:border-slate-800 flex items-center gap-4 text-xs font-medium text-[#9CA3AF] dark:text-slate-500">
            <span>{completed.length} completed today</span>
            <span>·</span>
            <span>{skipped.length} skipped</span>
          </div>
        )}
      </motion.div>

      {/* ─── Bottom Row: Reviews ─── */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-900 rounded-[20px] p-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#111827] dark:text-slate-100">Recent Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-[#6B7280] dark:text-slate-400">
              <HiOutlineStar className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-semibold">{(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}</span>
              <span>· {reviews.length} reviews</span>
            </div>
          )}
        </div>

        {reviews.length > 0 ? (
          <div className="space-y-1">
            {reviews.slice(0, 5).map((r) => (
              <div key={r._id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-[#FAFBFC] dark:hover:bg-slate-800/30 transition-colors">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style={{ background: 'linear-gradient(135deg, #6D5EF7, #A78BFA)' }}>
                  {r.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#111827] dark:text-slate-200">{r.user?.name || 'Anonymous'}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <HiOutlineStar key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-[#E5E7EB] dark:text-slate-700'}`} />
                      ))}
                    </div>
                    <span className="text-[11px] text-[#9CA3AF] dark:text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="text-sm text-[#6B7280] dark:text-slate-400">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <HiOutlineStar className="w-8 h-8 text-[#E5E7EB] dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-[#6B7280] dark:text-slate-400">No reviews yet</p>
          </div>
        )}
      </motion.div>

      {/* ─── Walk-in Modal ─── */}
      <AnimatePresence>
        {showWalkIn && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowWalkIn(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-[24px] p-8 w-full max-w-md"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#111827] dark:text-slate-100">Add Walk-in Customer</h3>
                <button onClick={() => setShowWalkIn(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-slate-800 transition-colors">
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#374151] dark:text-slate-300 mb-2">Customer Name</label>
                <input type="text" value={walkInName} onChange={e => setWalkInName(e.target.value)} placeholder="Enter customer name"
                  className="w-full h-12 rounded-xl border border-[#E5E7EB] dark:border-slate-700 px-4 text-sm text-[#111827] dark:text-slate-200 placeholder-[#9CA3AF] dark:placeholder-slate-500 focus:outline-none focus:border-[#6D5EF7] focus:ring-2 focus:ring-[#6D5EF7]/10 transition-all bg-[#F9FAFB] dark:bg-slate-800"
                  onKeyDown={e => { if (e.key === 'Enter') handleAddWalkIn(); }} autoFocus />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowWalkIn(false)} className="flex-1 h-12 rounded-xl border border-[#E5E7EB] dark:border-slate-700 text-sm font-semibold text-[#6B7280] dark:text-slate-400 hover:bg-[#F9FAFB] dark:hover:bg-slate-800 transition-all">
                  Cancel
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAddWalkIn} disabled={adding || !walkInName.trim()}
                  className="flex-1 h-12 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-all"
                  style={{ background: 'linear-gradient(135deg, #6D5EF7, #A78BFA)' }}>
                  {adding ? 'Adding...' : 'Add to Queue'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
