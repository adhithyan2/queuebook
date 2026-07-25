import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { businessAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { HiOutlineUsers, HiOutlineCheck, HiOutlineXCircle, HiOutlinePlus, HiOutlineX } from 'react-icons/hi';

export default function BusinessQueuePage() {
  const socket = useSocket();
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [adding, setAdding] = useState(false);

  const loadQueue = () => {
    businessAPI.getDashboard()
      .then(res => {
        setQueue(res.data.queue);
        setStats(res.data.stats);
        if (socket && res.data.business?._id) {
          socket.emit('join-business-room', res.data.business._id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadQueue(); }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = (updatedQueue) => {
      setQueue(updatedQueue);
      businessAPI.getDashboard().then(res => setStats(res.data.stats)).catch(() => {});
    };
    socket.on('queue-refresh', handleRefresh);
    socket.on('booking-notification', () => loadQueue());
    return () => {
      socket.off('queue-refresh', handleRefresh);
      socket.off('booking-notification');
    };
  }, [socket]);

  const handleCallNext = async () => {
    try { await businessAPI.callNext(); loadQueue(); } catch (err) { alert(err.response?.data?.message || 'No one in queue'); }
  };
  const handleSkip = async (id) => { try { await businessAPI.skipCustomer(id); loadQueue(); } catch {} };
  const handleComplete = async (id) => { try { await businessAPI.completeAppointment(id); loadQueue(); } catch {} };
  const handleAddWalkIn = async () => {
    setAdding(true);
    try { await businessAPI.addWalkIn({ name: walkInName }); setWalkInName(''); setShowWalkIn(false); loadQueue(); } catch {}
    setAdding(false);
  };

  function customerName(item) {
    if (item.walkInName) return item.walkInName;
    return item.user?.name || 'Unknown';
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const waiting = queue.filter(q => q.status === 'waiting');
  const active = queue.filter(q => q.status === 'waiting' || q.status === 'called');
  const completed = queue.filter(q => q.status === 'completed' || q.status === 'skipped');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Queue Management</h1>
          <p className="text-slate-500 mt-1 text-sm">{stats?.waiting || 0} waiting &middot; {stats?.total || 0} total today</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={() => setShowWalkIn(true)}>
            <HiOutlinePlus className="w-4 h-4" /> Walk-in
          </Button>
          <Button variant="gradient" onClick={handleCallNext} disabled={waiting.length === 0}>
            Call Next
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-[20px] border border-slate-100 p-5 card-shadow text-center">
          <p className="text-3xl font-bold text-primary">{stats?.waiting || 0}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Waiting</p>
        </div>
        <div className="bg-white rounded-[20px] border border-slate-100 p-5 card-shadow text-center">
          <p className="text-3xl font-bold text-emerald-600">{stats?.completed || 0}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Completed</p>
        </div>
        <div className="bg-white rounded-[20px] border border-slate-100 p-5 card-shadow text-center">
          <p className="text-3xl font-bold text-red-500">{stats?.skipped || 0}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Skipped</p>
        </div>
      </div>

      {/* Active Queue */}
      <div className="bg-white rounded-[20px] border border-slate-100 p-6 card-shadow mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">Active Queue</h2>
        {active.length > 0 ? (
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
                {active.map((item, i) => (
                  <motion.tr key={item._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 text-sm font-bold text-slate-800">Q{String(item.tokenNumber).padStart(3, '0')}</td>
                    <td className="py-3.5 text-sm text-slate-700">{customerName(item)}</td>
                    <td className="py-3.5"><Badge variant={item.status === 'called' ? 'confirmed' : 'pending'}>{item.status}</Badge></td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.status === 'waiting' && (
                          <>
                            <button onClick={() => handleComplete(item._id)} className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all">Done</button>
                            <button onClick={() => handleSkip(item._id)} className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-all">Skip</button>
                          </>
                        )}
                        {item.status === 'called' && (
                          <button onClick={() => handleComplete(item._id)} className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all">Complete</button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <HiOutlineUsers className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Queue is empty</p>
            <p className="text-xs text-slate-400 mt-1">No customers waiting at the moment.</p>
          </div>
        )}
      </div>

      {/* Completed */}
      <div className="bg-white rounded-[20px] border border-slate-100 p-6 card-shadow">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">Completed Today</h2>
        {completed.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-400 pb-3 uppercase tracking-wider">Token</th>
                  <th className="text-left text-xs font-medium text-slate-400 pb-3 uppercase tracking-wider">Customer</th>
                  <th className="text-left text-xs font-medium text-slate-400 pb-3 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((item) => (
                  <tr key={item._id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 text-sm font-bold text-slate-800">Q{String(item.tokenNumber).padStart(3, '0')}</td>
                    <td className="py-3 text-sm text-slate-700">{customerName(item)}</td>
                    <td className="py-3"><Badge variant={item.status === 'completed' ? 'active' : 'cancelled'}>{item.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">No completed entries yet</p>
        )}
      </div>

      <AnimatePresence>
        {showWalkIn && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setShowWalkIn(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[20px] p-6 w-full max-w-sm mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-slate-900">Add Walk-in</h3>
                <button onClick={() => setShowWalkIn(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                  <HiOutlineX className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">Customer Name</label>
                <input type="text" value={walkInName} onChange={e => setWalkInName(e.target.value)}
                  placeholder="Walk-in"
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  onKeyDown={e => { if (e.key === 'Enter') handleAddWalkIn(); }} autoFocus />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setShowWalkIn(false)}>Cancel</Button>
                <Button variant="gradient" fullWidth onClick={handleAddWalkIn} disabled={adding}>
                  {adding ? 'Adding...' : 'Add to Queue'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
