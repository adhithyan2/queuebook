import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { businessAPI, customerAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlinePlay, HiOutlinePause, HiOutlineCheck, HiOutlineXMark,
  HiOutlinePlus, HiOutlineUsers, HiOutlineClock, HiOutlineStar,
  HiOutlineArrowPath, HiOutlineMegaphone, HiOutlineCalendar,
  HiOutlineShieldCheck, HiOutlineShieldExclamation, HiOutlineQrCode,
} from 'react-icons/hi2';

function useTimer(isRunning) {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (isRunning) { setSeconds(0); ref.current = setInterval(() => setSeconds(s => s + 1), 1000); }
    else { clearInterval(ref.current); setSeconds(0); }
    return () => clearInterval(ref.current);
  }, [isRunning]);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

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
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(null);
  const scannerRef = useRef(null);

  const loadDashboard = () => {
    Promise.all([businessAPI.getDashboard(), businessAPI.getAnalytics()])
      .then(([d, a]) => {
        setDashboard(d.data); setAnalytics(a.data);
        if (d.data.business?._id) customerAPI.getReviews(d.data.business._id).then(r => setReviews(r.data.reviews || [])).catch(() => {});
      }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadDashboard(); }, []);

  useEffect(() => {
    if (!socket || !dashboard?.business?._id) return;
    socket.emit('join-business-room', dashboard.business._id);
    const h = () => loadDashboard();
    socket.on('queue-refresh', h); socket.on('booking-notification', h);
    return () => { socket.off('queue-refresh', h); socket.off('booking-notification', h); };
  }, [socket, dashboard?.business?._id]);

  const refresh = async () => { try { const r = await businessAPI.getDashboard(); setDashboard(r.data); } catch {} };
  const handleCallNext = async () => { try { await businessAPI.callNext(); await refresh(); } catch (e) { alert(e.response?.data?.message || 'No one in queue'); } };
  const handleSkip = async (id) => { try { await businessAPI.skipCustomer(id); await refresh(); } catch {} };
  const handleComplete = async (id) => { try { await businessAPI.completeAppointment(id); await refresh(); } catch {} };
  const handleAddWalkIn = async () => {
    if (!walkInName.trim()) return; setAdding(true);
    try { await businessAPI.addWalkIn({ name: walkInName.trim() }); setWalkInName(''); setShowWalkIn(false); await refresh(); } catch {}
    setAdding(false);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try { scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setShowScanner(false);
    setScanned(null);
  };

  const startScanner = () => {
    setShowScanner(true);
    setScanned(null);
    setTimeout(() => {
      const element = document.getElementById('qr-scanner');
      if (!element) return;
      try {
        const scanner = new Html5Qrcode('qr-scanner');
        scannerRef.current = scanner;
        scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText) => {
            await scanner.stop();
            scannerRef.current = null;
            const match = decodedText.match(/\/queue\/([a-f0-9]{24})\/scan/i) || decodedText.match(/\/verify\/([a-f0-9]{24})/i);
            if (!match) { setScanned({ error: 'Not a QueueBook check-in token' }); return; }
            try {
              const r = await customerAPI.verifyQueueToken(match[1]);
              setScanned(r.data.queue);
            } catch (e) {
              setScanned({ error: e.response?.data?.message || 'Token verification failed' });
            }
          },
          (error) => { if (error?.name !== 'NotFoundException') console.warn(error); }
        );
      } catch (e) {
        setScanned({ error: 'Could not start camera: ' + e.message });
      }
    }, 150);
  };

  const { queue = [], business } = dashboard || {};
  const called = queue.find(q => q.status === 'called');
  const waiting = queue.filter(q => q.status === 'waiting');
  const completed = queue.filter(q => q.status === 'completed');
  const skipped = queue.filter(q => q.status === 'skipped');
  const timer = useTimer(!!called);
  const notApproved = business?.approvalStatus === 'pending' || business?.approvalStatus === 'rejected';

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {notApproved && (
        <div className={`flex items-start gap-3 rounded-2xl border px-5 py-4 mb-6 ${
          business?.approvalStatus === 'rejected'
            ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            business?.approvalStatus === 'rejected' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-amber-100 dark:bg-amber-500/20'
          }`}>
            {business?.approvalStatus === 'rejected'
              ? <HiOutlineShieldExclamation className="w-5 h-5 text-red-600 dark:text-red-400" />
              : <HiOutlineShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {business?.approvalStatus === 'rejected' ? 'Business application rejected' : 'Business awaiting approval'}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
              {business?.approvalStatus === 'rejected'
                ? 'Your business was not approved by the QueueBook admin. Contact support if you believe this is a mistake.'
                : 'Your business is under review. Customers cannot see or book your business until an admin approves it. Queue tools are read-only for now.'}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{business?.name || 'Dashboard'}</h1>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${queuePaused ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${queuePaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
            {queuePaused ? 'Paused' : 'Open'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${called ? 'bg-primary animate-pulse' : 'bg-zinc-300'}`} />
              <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Currently Serving</h2>
            </div>
            {called && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-mono text-sm font-bold">
                <HiOutlineClock className="w-3.5 h-3.5" /> {timer}
              </div>
            )}
          </div>
          {called ? (
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-extrabold flex-shrink-0">
                Q{String(called.tokenNumber).padStart(3, '0')}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">{called.user?.name || called.walkInName || 'Unknown'}</h3>
                <div className="flex items-center gap-2 mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {called.service && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary" />{called.service}</span>}
                  {called.timeSlot && <span className="flex items-center gap-1"><HiOutlineCalendar className="w-3.5 h-3.5" />{called.timeSlot}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleComplete(called._id)} disabled={notApproved}
                  className="h-10 px-5 rounded-xl bg-emerald-500 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <HiOutlineCheck className="w-4 h-4" /> Complete
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSkip(called._id)} disabled={notApproved}
                  className="h-10 px-5 rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-sm font-semibold flex items-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <HiOutlineXMark className="w-4 h-4" /> Skip
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                <HiOutlineUsers className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No customer currently being served</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {[
            { label: 'Waiting', value: waiting.length, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: HiOutlineUsers },
            { label: 'Completed', value: completed.length, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: HiOutlineCheck },
            { label: 'Skipped', value: skipped.length, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', icon: HiOutlineXMark },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{s.value}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{s.label}</p>
              </div>
            </div>
          ))}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <HiOutlineClock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{business?.avgServiceTime || 5}m</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Avg Wait</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 mb-5">
        <div className="flex flex-wrap gap-2">
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleCallNext} disabled={waiting.length === 0 || notApproved}
            className="h-10 px-5 rounded-xl gradient-primary text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <HiOutlineMegaphone className="w-4 h-4" /> Call Next
          </motion.button>
          <button onClick={() => { if (called) handleCallNext(); }} disabled={!called || notApproved}
            className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors flex items-center gap-1.5">
            <HiOutlineArrowPath className="w-4 h-4" /> Recall
          </button>
          <button onClick={() => setQueuePaused(p => !p)} disabled={notApproved}
            className={`h-10 px-4 rounded-xl border text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              queuePaused ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}>
            {queuePaused ? <><HiOutlinePlay className="w-4 h-4" /> Resume</> : <><HiOutlinePause className="w-4 h-4" /> Pause</>}
          </button>
          <div className="flex-1" />
          <button onClick={startScanner} disabled={notApproved}
            className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
            <HiOutlineQrCode className="w-4 h-4" /> Scan QR
          </button>
          <button onClick={() => setShowWalkIn(true)} disabled={notApproved}
            className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
            <HiOutlinePlus className="w-4 h-4" /> Walk-in
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Waiting Queue</h2>
          <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">{waiting.length} customers</span>
        </div>
        {waiting.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  {['Token', 'Customer', 'Service', 'Time', 'Actions'].map(h => (
                    <th key={h} className={`text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-500 pb-3 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {waiting.map((item) => (
                  <tr key={item._id} className="border-b border-zinc-50 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3"><span className="inline-flex items-center justify-center w-12 h-7 rounded-lg bg-primary/10 text-primary text-[11px] font-bold">Q{String(item.tokenNumber).padStart(3, '0')}</span></td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">{(item.user?.name || item.walkInName || '?').charAt(0).toUpperCase()}</div>
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{item.user?.name || item.walkInName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-zinc-500 dark:text-zinc-400">{item.service || '—'}</td>
                    <td className="py-3 text-sm text-zinc-500 dark:text-zinc-400 font-mono">{item.timeSlot || '—'}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleComplete(item._id)} disabled={notApproved} className="px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-40">Done</button>
                        <button onClick={() => handleSkip(item._id)} disabled={notApproved} className="px-3 py-1 text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-40">Skip</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <HiOutlineUsers className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Queue is empty</p>
          </div>
        )}
        {(completed.length > 0 || skipped.length > 0) && (
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 text-[11px] text-zinc-400">
            <span>{completed.length} completed</span><span>·</span><span>{skipped.length} skipped</span>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Recent Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-zinc-500">
              <HiOutlineStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}</span>
              <span>· {reviews.length}</span>
            </div>
          )}
        </div>
        {reviews.length > 0 ? (
          <div className="space-y-1">
            {reviews.slice(0, 5).map(r => (
              <div key={r._id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{r.user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{r.user?.name || 'Anonymous'}</span>
                    <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <HiOutlineStar key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200 dark:text-zinc-700'}`} />)}</div>
                    <span className="text-[10px] text-zinc-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <HiOutlineStar className="w-6 h-6 text-zinc-200 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No reviews yet</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showScanner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={stopScanner}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-100 dark:border-zinc-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Scan Check-in Token</h3>
                <button onClick={stopScanner} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
              </div>

              {!scanned ? (
                <>
                  <div id="qr-scanner" className="w-full aspect-square rounded-xl overflow-hidden bg-zinc-950 mb-3" />
                  <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                    Point the camera at the customer's QR code
                  </p>
                </>
              ) : scanned.error ? (
                <div className="text-center py-6">
                  <HiOutlineShieldExclamation className="w-10 h-10 text-red-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Verification Failed</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{scanned.error}</p>
                  <button onClick={startScanner} className="mt-4 px-4 py-2 text-xs font-medium bg-primary text-white rounded-xl hover:opacity-90 transition-opacity">
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                    <HiOutlineCheck className="w-7 h-7 text-emerald-600" />
                  </div>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{scanned.customerName || scanned.walkInName || 'Customer'}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{scanned.businessName}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold mt-3">
                    Token Q{scanned.tokenNumber}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 capitalize">
                    Status: {scanned.status}{scanned.position ? ` · Position #${scanned.position}` : ''}
                  </p>
                  <button onClick={stopScanner} className="mt-4 w-full h-10 rounded-xl gradient-primary text-white text-sm font-semibold">
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {showWalkIn && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowWalkIn(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-100 dark:border-zinc-800 shadow-xl">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4">Add Walk-in Customer</h3>
              <input type="text" value={walkInName} onChange={e => setWalkInName(e.target.value)} placeholder="Customer name"
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                onKeyDown={e => { if (e.key === 'Enter') handleAddWalkIn(); }} autoFocus />
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowWalkIn(false)} className="flex-1 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleAddWalkIn} disabled={adding || !walkInName.trim()}
                  className="flex-1 h-10 rounded-xl gradient-primary text-white text-sm font-semibold disabled:opacity-40 transition-all">{adding ? 'Adding...' : 'Add to Queue'}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
