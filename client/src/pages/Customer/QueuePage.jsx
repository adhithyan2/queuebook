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
        active.forEach(q => {
          if (socket) socket.emit('join-queue-room', q._id);
        });
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
          const wait = ahead * 5;
          return {
            ...q,
            position: data.peopleAhead + 1,
            estimatedWaitTime: wait,
          };
        }
        return q;
      }));
    };
    socket.on('position-update', handlePositionUpdate);
    return () => socket.off('position-update', handlePositionUpdate);
  }, [socket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="pt-6 mb-10">
        <h1 className="text-4xl font-bold text-slate-900">My Queue</h1>
        <p className="text-slate-500 mt-2">Track your active queue positions in real-time.</p>
      </div>

      {queues.length > 0 ? queues.map((q) => {
        const ahead = q.peopleAhead ?? Math.max(0, (q.position || 1) - 1);
        const wait = q.estimatedWaitTime ?? ahead * 5;
        const progress = q.position > 0 ? Math.min((1 / q.position) * 100, 95) : 0;

        return (
          <motion.div
            key={q._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow max-w-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <HiOutlineUsers className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{q.business?.name || 'Business'}</h3>
                  <p className="text-sm text-slate-500">Token Q{String(q.tokenNumber).padStart(3, '0')}</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {q.status === 'called' ? 'Called' : 'In Queue'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
              {[
                { label: 'Position', value: `${q.position || '-'}`, color: 'text-indigo-600' },
                { label: 'Token', value: `Q${String(q.tokenNumber).padStart(3, '0')}`, color: 'text-slate-900' },
                { label: 'People Ahead', value: ahead, color: 'text-amber-600' },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Queue Progress</span>
                <span className="text-xs font-medium text-slate-700">Position {q.position || '-'}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full gradient-primary rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-indigo-50 rounded-2xl mb-8">
              <div className="flex items-center gap-3">
                <HiOutlineClock className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-xs text-indigo-600 font-medium">Estimated Wait Time</p>
                  <p className="text-xl font-bold text-indigo-700">~{wait} minutes</p>
                </div>
              </div>
              <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2">
                <HiOutlineBell className="w-4 h-4" /> Notify Me
              </button>
            </div>
          </motion.div>
        );
      }) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 lg:p-20 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-5">
            <HiOutlineTrendingUp className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Not in any queue</h3>
          <p className="text-sm text-slate-400">Book an appointment to join a queue.</p>
          <Link to="/customer/nearby" className="mt-4 inline-block px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all">
            Find Services
          </Link>
        </div>
      )}
    </motion.div>
  );
}
