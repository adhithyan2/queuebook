import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import {
  HiOutlineHashtag, HiOutlineUsers, HiOutlineClock,
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineArrowPath, HiOutlineBuildingStorefront,
  HiOutlineSparkles, HiOutlineMapPin,
} from 'react-icons/hi2';
import { queueAPI } from '../../services/api';

const ACCENT = '#6D5EF7';

const statusConfig = {
  waiting: {
    label: 'Waiting',
    sub: 'You are in the queue',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    icon: HiOutlineClock,
  },
  called: {
    label: 'Serving',
    sub: 'It’s your turn — please proceed',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    icon: HiOutlineCheckCircle,
  },
  completed: {
    label: 'Completed',
    sub: 'Your turn has been served',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
    icon: HiOutlineCheckCircle,
  },
  skipped: {
    label: 'Skipped',
    sub: 'This token was passed',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
    icon: HiOutlineXCircle,
  },
  cancelled: {
    label: 'Cancelled',
    sub: 'This token was cancelled',
    color: 'text-zinc-600',
    bg: 'bg-zinc-100',
    border: 'border-zinc-200',
    dot: 'bg-zinc-400',
    icon: HiOutlineXCircle,
  },
};

function LiveClock({ timestamp }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const diff = Math.max(0, (now - new Date(timestamp || now).getTime()) / 1000);
  const seconds = Math.floor(diff);
  const minutes = Math.floor(seconds / 60);
  const display = minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  return <span className="font-mono tabular-nums">{display}</span>;
}

export default function QueueScanPage() {
  const { queueId } = useParams();
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchQueue = useCallback(async (showSpinner = true) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await queueAPI.getScan(queueId);
      setQueue(res.data.queue);
      setError('');
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load queue information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [queueId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    const interval = setInterval(() => fetchQueue(false), 15000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const status = statusConfig[queue?.status] || statusConfig.waiting;
  const StatusIcon = status.icon;
  const qrValue = typeof window !== 'undefined' ? `${window.location.origin}/queue/${queueId}/scan` : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-[#6D5EF7]/20 border-t-[#6D5EF7] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 mt-4">Loading queue information…</p>
        </div>
      </div>
    );
  }

  if (error || !queue) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[20px] shadow-[0_2px_24px_rgba(15,23,42,0.08)] border border-zinc-100 p-8 max-w-sm w-full text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <HiOutlineXCircle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-base font-bold text-zinc-900">Queue Not Found</h1>
          <p className="text-xs text-zinc-500 mt-2">{error}</p>
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => { setLoading(true); fetchQueue(); }}
              className="flex-1 py-2.5 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-semibold hover:bg-zinc-200 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/"
              className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold text-center"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` }}
            >
              Go to QueueBook
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const isActive = queue.status === 'waiting' || queue.status === 'called';
  const isServing = queue.status === 'called';

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div
        className="relative px-5 pt-12 pb-16 text-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${ACCENT}, #7C3AED)` }}
      >
        <div className="absolute -right-10 -top-14 w-44 h-44 rounded-full bg-white/10" />
        <div className="absolute right-24 -top-6 w-16 h-16 rounded-full bg-white/10" />
        <div className="absolute -left-12 -bottom-14 w-36 h-36 rounded-full bg-white/10" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-white text-[11px] font-semibold mb-4">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            QueueBook Live Queue
          </div>
          <h1 className="text-2xl font-extrabold text-white leading-tight">{queue.businessName}</h1>
          {queue.businessCategory && (
            <p className="text-white/75 text-sm capitalize mt-1">{queue.businessCategory}</p>
          )}
          {queue.serviceName && (
            <p className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 rounded-full bg-white text-[#6D5EF7] text-xs font-bold">
              <HiOutlineBuildingStorefront className="w-4 h-4" />
              {queue.serviceName}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 -mt-9 pb-10 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="max-w-sm mx-auto bg-white rounded-[20px] shadow-[0_4px_32px_rgba(15,23,42,0.10)] border border-zinc-100 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-center mb-5">
              <div className="bg-white rounded-2xl p-2 border border-zinc-100 shadow-sm">
                <QRCodeCanvas value={qrValue} size={92} level="M" bgColor="#ffffff" fgColor="#0f172a" />
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Your Token</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-white"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` }}
                >
                  <HiOutlineHashtag className="w-5 h-5 text-white/80" />
                  <span className="text-3xl font-extrabold tracking-wide">
                    Q{String(queue.tokenNumber || 0).padStart(3, '0')}
                  </span>
                </div>
              </div>
            </div>

            <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 mb-4 ${status.border} ${status.bg}`}>
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full ${status.dot} ${isServing ? 'animate-ping' : ''}`} />
                <div>
                  <p className={`text-sm font-bold ${status.color}`}>{status.label}</p>
                  <p className="text-[11px] text-zinc-500">{status.sub}</p>
                </div>
              </div>
              <StatusIcon className={`w-5 h-5 ${status.color}`} />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-[#6D5EF7]/[0.05] rounded-2xl p-3.5 text-center">
                <p className="text-[10px] text-zinc-400 mb-1">People Ahead</p>
                <p className="text-xl font-bold text-zinc-900 flex items-center justify-center gap-1">
                  {queue.peopleAhead}
                  <HiOutlineUsers className="w-3.5 h-3.5 text-zinc-300" />
                </p>
              </div>
              <div className="bg-[#6D5EF7]/[0.05] rounded-2xl p-3.5 text-center">
                <p className="text-[10px] text-zinc-400 mb-1">Est. Wait</p>
                <p className="text-xl font-bold text-zinc-900">
                  {queue.estimatedWaitTime}
                  <span className="text-[11px] font-medium text-zinc-400 ml-0.5">min</span>
                </p>
              </div>
              <div className="bg-[#6D5EF7]/[0.05] rounded-2xl p-3.5 text-center">
                <p className="text-[10px] text-zinc-400 mb-1">Now Serving</p>
                <p className="text-xl font-bold text-[#6D5EF7]">
                  {queue.currentToken ? `Q${String(queue.currentToken).padStart(3, '0')}` : '—'}
                </p>
              </div>
            </div>

            {isActive && queue.peopleAhead === 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center mb-4">
                <p className="text-emerald-700 text-sm font-bold">You're next!</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">Please stay close to the service counter</p>
              </div>
            )}
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={() => fetchQueue(true)}
              disabled={refreshing}
              className="w-full py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` }}
            >
              <HiOutlineArrowPath className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh Status'}
            </button>

            <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-zinc-400">
              <HiOutlineArrowPath className="w-3.5 h-3.5" />
              <span>Auto-updates every 15s · Last updated </span>
              {lastUpdated && <LiveClock timestamp={lastUpdated} />} ago
            </div>

            {queue.businessAddress && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-zinc-400">
                <HiOutlineMapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[240px]">{queue.businessAddress}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 mt-4 pt-4 border-t border-zinc-100 text-[11px] text-zinc-400">
              <HiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Secured by QueueBook check-in system
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
