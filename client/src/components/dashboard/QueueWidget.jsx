import { motion } from 'framer-motion';
import { HiOutlineBell, HiOutlineUsers } from 'react-icons/hi';

export default function QueueWidget() {
  const currentToken = 42;
  const yourToken = 47;
  const peopleAhead = yourToken - currentToken;
  const estimatedWait = peopleAhead * 5;
  const progress = (currentToken / yourToken) * 100;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <HiOutlineUsers className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Live Queue</h3>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          12 active
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Current Token</p>
          <p className="text-2xl font-bold text-indigo-600">Q{String(currentToken).padStart(3, '0')}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Your Token</p>
          <p className="text-2xl font-bold text-slate-900">Q{String(yourToken).padStart(3, '0')}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Queue Progress</span>
          <span className="text-xs font-medium text-slate-700">{currentToken}/{yourToken}</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full gradient-primary rounded-full"
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-6 bg-indigo-50 rounded-2xl mb-6">
        <div>
          <p className="text-xs text-indigo-600 font-medium">People Ahead</p>
          <p className="text-xl font-bold text-indigo-700">{peopleAhead}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-indigo-600 font-medium">Est. Wait Time</p>
          <p className="text-xl font-bold text-indigo-700">~{estimatedWait} min</p>
        </div>
      </div>

      <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
        <HiOutlineBell className="w-4 h-4" />
        Notify Me
      </button>
    </div>
  );
}
