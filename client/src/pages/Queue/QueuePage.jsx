import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUsers, HiOutlineBell, HiOutlineClock, HiOutlineTrendingUp } from 'react-icons/hi';

const activeQueues = [
  { id: 1, business: 'City General Hospital', service: 'Cardiology', currentToken: 42, yourToken: 47 },
];

export default function QueuePage() {
  const [queues] = useState(activeQueues);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">My Queue</h1>
        <p className="text-slate-500 mt-2">Track your active queue positions in real-time.</p>
      </div>

      {queues.length > 0 ? queues.map((q) => {
        const ahead = q.yourToken - q.currentToken;
        const wait = ahead * 5;
        const progress = (q.currentToken / q.yourToken) * 100;

        return (
          <motion.div
            key={q.id}
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
                  <h3 className="text-lg font-semibold text-slate-900">{q.business}</h3>
                  <p className="text-sm text-slate-500">{q.service}</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                In Queue
              </span>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
              {[
                { label: 'Current Token', value: `Q${String(q.currentToken).padStart(3, '0')}`, color: 'text-indigo-600' },
                { label: 'Your Token', value: `Q${String(q.yourToken).padStart(3, '0')}`, color: 'text-slate-900' },
                { label: 'People Ahead', value: ahead, color: 'text-amber-600' },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Queue Progress</span>
                <span className="text-xs font-medium text-slate-700">{q.currentToken}/{q.yourToken}</span>
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

            <div className="flex items-center justify-between p-6 bg-indigo-50 rounded-2xl mb-6">
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

            <button className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">Leave Queue</button>
          </motion.div>
        );
      }) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 lg:p-20 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-5">
            <HiOutlineTrendingUp className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Not in any queue</h3>
          <p className="text-sm text-slate-400">Book an appointment to join a queue.</p>
        </div>
      )}
    </motion.div>
  );
}
