import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { queueAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { HiOutlineUsers, HiOutlineClock, HiOutlineBell, HiOutlineTrendingUp } from 'react-icons/hi';

export default function CustomerQueuePage() {
  const socket = useSocket();
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    queueAPI.getMyQueue()
      .then(res => {
        const active = res.data.queues?.filter(q => q.status === 'waiting' || q.status === 'called') || [];
        setQueues(active);
        active.forEach(q => { if (socket) socket.emit('join-queue-room', q._id); });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const handlePositionUpdate = (data) => {
      setQueues(prev => prev.map(q => {
        if (q._id === data.queueId) {
          const ahead = data.peopleAhead;
          return { ...q, position: data.peopleAhead + 1, estimatedWaitTime: ahead * 5 };
        }
        return q;
      }));
    };
    socket.on('position-update', handlePositionUpdate);
    return () => socket.off('position-update', handlePositionUpdate);
  }, [socket]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Queue</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Track your active queue positions in real-time.</p>
      </div>

      {queues.length > 0 ? queues.map((q) => {
        const ahead = q.peopleAhead ?? Math.max(0, (q.position || 1) - 1);
        const wait = q.estimatedWaitTime ?? ahead * 5;
        const progress = q.position > 0 ? Math.min((1 / q.position) * 100, 95) : 0;

        return (
          <motion.div key={q._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-[20px] border border-slate-100 dark:border-slate-700 p-6 card-shadow max-w-2xl mb-6">
            {ahead === 1 && q.status !== 'called' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="mb-5 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <HiOutlineBell className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-sm font-semibold text-amber-700">You're almost there! Only 1 person ahead.</p>
              </motion.div>
            )}
            {ahead === 0 && q.status !== 'called' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="mb-5 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <HiOutlineBell className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <p className="text-sm font-semibold text-emerald-700">You're next! Be ready to be called.</p>
              </motion.div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
                  <HiOutlineUsers className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{q.business?.name || 'Business'}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Token Q{String(q.tokenNumber).padStart(3, '0')}</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {q.status === 'called' ? 'Called' : 'In Queue'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Position', value: `${q.position || '-'}`, color: 'text-primary' },
                { label: 'Token', value: `Q${String(q.tokenNumber).padStart(3, '0')}`, color: 'text-slate-900 dark:text-slate-100' },
                { label: 'People Ahead', value: ahead, color: 'text-amber-600' },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Queue Progress</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Position {q.position || '-'}</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }} className="h-full gradient-primary rounded-full" />
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-primary-50 rounded-xl">
              <div className="flex items-center gap-3">
                <HiOutlineClock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-primary font-medium">Estimated Wait</p>
                  <p className="text-lg font-bold text-primary">~{wait} min</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition-all">
                Notify Me
              </button>
            </div>
          </motion.div>
        );
      }) : (
        <div className="bg-white dark:bg-slate-800 rounded-[20px] border border-slate-100 dark:border-slate-700 p-16 text-center max-w-lg mx-auto card-shadow">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <HiOutlineTrendingUp className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Not in any queue</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">Book an appointment to join a queue.</p>
          <Link to="/customer/nearby" className="inline-block px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all">
            Find Services
          </Link>
        </div>
      )}
    </motion.div>
  );
}
