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
    try {
      await businessAPI.callNext();
      loadQueue();
    } catch (err) {
      alert(err.response?.data?.message || 'No one in queue');
    }
  };

  const handleSkip = async (id) => {
    try { await businessAPI.skipCustomer(id); loadQueue(); } catch {}
  };

  const handleComplete = async (id) => {
    try { await businessAPI.completeAppointment(id); loadQueue(); } catch {}
  };

  const handleAddWalkIn = async () => {
    setAdding(true);
    try {
      await businessAPI.addWalkIn({ name: walkInName });
      setWalkInName('');
      setShowWalkIn(false);
      loadQueue();
    } catch {}
    setAdding(false);
  };

  function customerName(item) {
    if (item.walkInName) return item.walkInName;
    return item.user?.name || 'Unknown';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const waiting = queue.filter(q => q.status === 'waiting');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">Queue Management</h1>
          <p className="text-slate-500 mt-2.5">{stats?.waiting || 0} waiting &middot; {stats?.total || 0} total today</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setShowWalkIn(true)}>
            <HiOutlinePlus className="w-4 h-4" /> Add Walk-in
          </Button>
          <Button variant="gradient" onClick={handleCallNext} disabled={waiting.length === 0}>
            Call Next
          </Button>
        </div>
      </div>

      <div className="grid gap-10 mb-10">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-indigo-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">{stats?.waiting || 0}</p>
              <p className="text-xs text-indigo-500 mt-1">Waiting</p>
            </div>
            <div className="flex-1 bg-emerald-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-emerald-600">{stats?.completed || 0}</p>
              <p className="text-xs text-emerald-500 mt-1">Completed</p>
            </div>
            <div className="flex-1 bg-red-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{stats?.skipped || 0}</p>
              <p className="text-xs text-red-500 mt-1">Skipped</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
          {queue.filter(q => q.status === 'waiting' || q.status === 'called').length > 0 ? (
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
                {queue.filter(q => q.status === 'waiting' || q.status === 'called').map((item, i) => (
                  <motion.tr
                    key={item._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-4 text-sm font-bold text-slate-800">Q{String(item.tokenNumber).padStart(3, '0')}</td>
                    <td className="py-4 text-sm text-slate-700">{customerName(item)}</td>
                    <td className="py-4"><Badge variant={item.status === 'called' ? 'confirmed' : 'pending'}>{item.status}</Badge></td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.status === 'waiting' && (
                          <>
                            <button onClick={() => handleComplete(item._id)} className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Complete">
                              <HiOutlineCheck className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleSkip(item._id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Skip">
                              <HiOutlineXCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {item.status === 'called' && (
                          <button onClick={() => handleComplete(item._id)} className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all">
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <HiOutlineUsers className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">Queue is empty</p>
            <p className="text-xs text-slate-400 mt-1">No customers waiting at the moment.</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Completed Today</h2>
        {queue.filter(q => q.status === 'completed' || q.status === 'skipped').length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-400 pb-4">Token</th>
                  <th className="text-left text-xs font-medium text-slate-400 pb-4">Customer</th>
                  <th className="text-left text-xs font-medium text-slate-400 pb-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {queue.filter(q => q.status === 'completed' || q.status === 'skipped').map((item, i) => (
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
    </div>

      <AnimatePresence>
        {showWalkIn && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setShowWalkIn(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Add Walk-in</h3>
                <button onClick={() => setShowWalkIn(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <HiOutlineX className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Customer Name</label>
                <input type="text" value={walkInName} onChange={e => setWalkInName(e.target.value)}
                  placeholder="Walk-in"
                  className="w-full h-[56px] rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  onKeyDown={e => { if (e.key === 'Enter') handleAddWalkIn(); }} autoFocus />
              </div>
              <div className="flex gap-4">
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
