import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { businessAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import CompleteModal from '../../components/business/CompleteModal';
import {
  HiOutlineUsers, HiOutlineCheck, HiOutlineXMark, HiOutlinePlus,
  HiOutlineClock, HiOutlineArrowPath, HiOutlineMegaphone,
} from 'react-icons/hi2';

export default function QueuePage() {
  const socket = useSocket();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [adding, setAdding] = useState(false);
  const [skippingId, setSkippingId] = useState(null);
  const [checkingInId, setCheckingInId] = useState(null);
  const [noShowId, setNoShowId] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [completing, setCompleting] = useState(false);

  const loadDashboard = async () => {
    try {
      const res = await businessAPI.getDashboard();
      setDashboard(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadDashboard(); }, []);

  useEffect(() => {
    if (!socket || !dashboard?.business?._id) return;
    socket.emit('join-business-room', dashboard.business._id);
    const h = () => loadDashboard();
    socket.on('queue-refresh', h);
    socket.on('appointments-refresh', h);
    return () => { socket.off('queue-refresh', h); socket.off('appointments-refresh', h); };
  }, [socket, dashboard?.business?._id]);

  const refresh = async () => { try { const r = await businessAPI.getDashboard(); setDashboard(r.data); } catch {} };
  const handleSkip = async (id) => {
    if (skippingId) return;
    setSkippingId(id);
    try { await businessAPI.skipCustomer(id); await refresh(); }
    catch (e) { alert(e.response?.data?.message || 'Could not skip this customer'); }
    finally { setSkippingId(null); }
  };
  const handleCheckInAppt = async (id) => {
    if (checkingInId) return;
    setCheckingInId(id);
    try { await businessAPI.checkInAppointment(id); await refresh(); }
    catch (e) { alert(e.response?.data?.message || 'Could not check in the appointment'); }
    finally { setCheckingInId(null); }
  };
  const handleNoShow = async (id) => {
    if (noShowId) return;
    if (!window.confirm('Mark this appointment as no-show? The customer will be notified.')) return;
    setNoShowId(id);
    try { await businessAPI.markNoShow(id); await refresh(); }
    catch (e) { alert(e.response?.data?.message || 'Could not mark as no-show'); }
    finally { setNoShowId(null); }
  };
  const handleAddWalkIn = async () => {
    if (!walkInName.trim()) return; setAdding(true);
    try { await businessAPI.addWalkIn({ name: walkInName.trim() }); setWalkInName(''); setShowWalkIn(false); await refresh(); } catch {}
    setAdding(false);
  };

  const { queue = [] } = dashboard || {};
  const upcoming = dashboard?.upcomingAppointments || [];
  const called = queue.find(q => q.status === 'called');
  const waiting = queue.filter(q => q.status === 'waiting');
  const completed = queue.filter(q => q.status === 'completed');
  const skipped = queue.filter(q => q.status === 'skipped');
  const allDone = [...completed, ...skipped];

  const handleComplete = (id, item) => setCompleteTarget({ id, item });
  const confirmComplete = async (paid) => {
    if (!completeTarget || completing) return;
    setCompleting(true);
    try {
      await businessAPI.completeAppointment(completeTarget.id, { paid });
      setCompleteTarget(null);
      await refresh();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not complete the appointment');
    } finally { setCompleting(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Queue Management</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5"><HiOutlineArrowPath className="w-3.5 h-3.5" /> Refresh</Button>
          <Button size="sm" onClick={() => setShowWalkIn(true)} className="gap-1.5"><HiOutlinePlus className="w-3.5 h-3.5" /> Walk-in</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Currently Serving', value: called ? 1 : 0, icon: HiOutlineMegaphone, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Waiting', value: waiting.length, icon: HiOutlineClock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Completed', value: completed.length, icon: HiOutlineCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Skipped', value: skipped.length, icon: HiOutlineXMark, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{s.value}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {upcoming.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Upcoming Appointments</h2>
            <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">{upcoming.length}</span>
          </div>
          <div className="space-y-2">
            {upcoming.map((a) => (
              <motion.div key={a._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.02 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{a.user?.name || 'Customer'}</p>
                  <p className="text-[11px] text-zinc-400">
                    {a.service}{a.staffName ? ` · ${a.staffName}` : ''} · {a.timeSlot}
                    {a.expectedStartTime && a.expectedEndTime ? ` · ${a.expectedStartTime}–${a.expectedEndTime}` : ''}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Expected window {a.arrivalWindowStart ? `from ${a.arrivalWindowStart.slice(11, 16)}` : ''}
                    {a.arrivalDeadline ? ` to ${a.arrivalDeadline.slice(11, 16)}` : ''}
                  </p>
                </div>
                {a.late ? <Badge variant="danger">Late</Badge> : null}
                {a.payment?.pending ? <Badge variant="warning">Payment pending</Badge> : null}
                <div className="flex gap-1.5">
                  <button onClick={() => handleCheckInAppt(a._id)} disabled={checkingInId === a._id}
                    className="px-2.5 py-1 text-[11px] font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {checkingInId === a._id ? 'Checking in…' : 'Check In'}
                  </button>
                  <button onClick={() => handleNoShow(a._id)} disabled={noShowId === a._id}
                    className="px-2.5 py-1 text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {noShowId === a._id ? '…' : 'No-show'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {called && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-primary/20 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Now Serving</h2>
            </div>
            <Badge variant="primary">Q{String(called.tokenNumber).padStart(3, '0')}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{called.user?.name || called.walkInName}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{called.service || 'Walk-in'} {called.timeSlot ? `· ${called.timeSlot}` : ''}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="success" size="sm" onClick={() => handleComplete(called._id, called)} disabled={completing} className="gap-1.5"><HiOutlineCheck className="w-3.5 h-3.5" /> Done</Button>
              <Button variant="danger" size="sm" onClick={() => handleSkip(called._id)} disabled={skippingId === called._id} className="gap-1.5"><HiOutlineXMark className="w-3.5 h-3.5" /> Skip</Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Waiting Queue</h2>
          <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">{waiting.length}</span>
        </div>
        {waiting.length > 0 ? (
          <div className="space-y-2">
            {waiting.map((item, i) => (
              <motion.div key={item._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  {(item.user?.name || item.walkInName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{item.user?.name || item.walkInName}</p>
                  <p className="text-[11px] text-zinc-400">
                    {item.service || 'Walk-in'}{item.staffName ? ` · ${item.staffName}` : ''} {item.timeSlot ? `· ${item.timeSlot}` : ''}
                  </p>
                  {item.estimatedWaitTime != null && (
                    <p className="text-[11px] text-primary font-medium mt-0.5">
                      ETA {item.estimatedWaitTime} min{item.peopleAhead > 0 ? ` · ${item.peopleAhead} ahead` : ''}
                    </p>
                  )}
                </div>
                <Badge variant="warning">Q{String(item.tokenNumber).padStart(3, '0')}</Badge>
                <div className="flex gap-1.5">
                  <button onClick={() => handleComplete(item._id, item)} disabled={completing} className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-40">Done</button>
                  <button onClick={() => handleSkip(item._id)} disabled={skippingId === item._id} className="px-2.5 py-1 text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-40">{skippingId === item._id ? '…' : 'Skip'}</button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <HiOutlineUsers className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No one waiting</p>
          </div>
        )}
      </div>

      {allDone.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">History</h2>
            <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">{allDone.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  {['Token', 'Customer', 'Status', 'Service'].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-500 pb-3 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allDone.map(item => (
                  <tr key={item._id} className="border-b border-zinc-50 dark:border-zinc-800/50 last:border-0">
                    <td className="py-2.5 text-sm font-mono text-zinc-600 dark:text-zinc-400">Q{String(item.tokenNumber).padStart(3, '0')}</td>
                    <td className="py-2.5 text-sm text-zinc-700 dark:text-zinc-300">{item.user?.name || item.walkInName}</td>
                    <td className="py-2.5"><Badge variant={item.status === 'completed' ? 'success' : 'danger'}>{item.status}</Badge></td>
                    <td className="py-2.5 text-sm text-zinc-500 dark:text-zinc-400">{item.service || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        <CompleteModal
          open={!!completeTarget}
          label={completeTarget?.item?.user?.name || completeTarget?.item?.walkInName || 'this customer'}
          amountLabel={completeTarget?.item?.appointmentAmount ? String(completeTarget.item.appointmentAmount) : ''}
          busy={completing}
          onPaid={() => confirmComplete(true)}
          onUnpaid={() => confirmComplete(false)}
          onClose={() => { if (!completing) setCompleteTarget(null); }}
        />
        {showWalkIn && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowWalkIn(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-100 dark:border-zinc-800 shadow-xl">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4">Add Walk-in Customer</h3>
              <input type="text" value={walkInName} onChange={e => setWalkInName(e.target.value)} placeholder="Customer name"
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                onKeyDown={e => { if (e.key === 'Enter') handleAddWalkIn(); }} autoFocus />
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowWalkIn(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleAddWalkIn} disabled={adding || !walkInName.trim()}>{adding ? 'Adding...' : 'Add'}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
