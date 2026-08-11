import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock, HiOutlineHashtag } from 'react-icons/hi2';
import { customerAPI } from '../../services/api';

const statusConfig = {
  waiting: { label: 'In Queue', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', icon: HiOutlineClock },
  called: { label: 'Now Serving', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20', icon: HiOutlineCheckCircle },
  completed: { label: 'Completed', color: 'text-zinc-600 bg-zinc-50 dark:bg-zinc-500/10 border-zinc-200 dark:border-zinc-800', icon: HiOutlineCheckCircle },
  skipped: { label: 'Skipped', color: 'text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20', icon: HiOutlineXCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20', icon: HiOutlineXCircle },
};

export default function VerifyPage() {
  const { queueId } = useParams();
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    customerAPI.verifyQueueToken(queueId)
      .then((res) => setQueue(res.data.queue))
      .catch((e) => setError(e.response?.data?.message || 'Token not found'))
      .finally(() => setLoading(false));
  }, [queueId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="w-6 h-6 border-2 border-indigo-400/20 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !queue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 max-w-sm w-full text-center">
          <HiOutlineXCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Token Not Found</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{error || 'This check-in token is invalid'}</p>
          <Link to="/" className="mt-5 inline-flex px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
            Go to QueueBook
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[queue.status] || statusConfig.waiting;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5">
          <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-widest">QueueBook Check-in</p>
          <h1 className="text-lg font-bold text-white mt-1">{queue.businessName || 'Business'}</h1>
        </div>

        <div className="p-6">
          <div className={`flex items-center justify-between rounded-xl border px-4 py-3 mb-5 ${status.color}`}>
            <div className="flex items-center gap-2">
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">{status.label}</span>
            </div>
            <span className="text-sm font-bold">{queue.tokenNumber != null ? `Q${queue.tokenNumber}` : '—'}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0">
              <HiOutlineHashtag className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Customer</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{queue.customerName || queue.walkInName || 'Walk-in'}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {queue.status === 'called'
                  ? 'Please proceed to the service desk'
                  : queue.status === 'completed'
                    ? 'This token has been served'
                    : `Position #${queue.position} · ~${queue.estimatedWaitTime} min wait`}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <HiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Verified by QueueBook check-in system
          </div>
        </div>
      </motion.div>
    </div>
  );
}
