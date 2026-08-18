import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { HiOutlineUsers, HiOutlineClock, HiOutlineBell, HiOutlineTrendingUp } from 'react-icons/hi';
import { HiOutlineQrCode, HiOutlineArrowDownTray } from 'react-icons/hi2';
import { useSocket } from '../../context/SocketContext';
import { queueAPI } from '../../services/api';
import Badge from '../../components/ui/Badge';

const QueuePage = () => {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const qrCanvasRefs = useRef({});

  const downloadQR = (queue) => {
    const canvas = qrCanvasRefs.current[queue._id];
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `queuebook-token-${queue.tokenNumber || queue._id}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const fetchQueues = useCallback(async () => {
    try {
      const response = await queueAPI.getMyQueue();
      const items = response.data.queues || [];
      setQueues(items);
      items.forEach((q) => socket?.emit('join-queue-room', q._id));
    } catch (error) {
      console.error('Failed to fetch queues:', error);
    } finally {
      setLoading(false);
    }
  }, [socket]);

  useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  useEffect(() => {
    if (socket) {
      socket.on('position-update', (data) => {
        setQueues((prev) =>
          prev.map((q) =>
            q._id === data.queueId
              ? { ...q, position: data.peopleAhead + 1, estimatedWaitTime: data.estimatedWaitTime }
              : q
          )
        );
      });

      return () => {
        socket.off('position-update');
      };
    }
  }, [socket]);

  const getStatusColor = (queue) => {
    if (queue.status === 'called') return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10';
    if (queue.status === 'completed') return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10';
    if (queue.status === 'skipped') return 'text-zinc-600 bg-zinc-50 dark:bg-zinc-500/10';
    if (queue.position === 1) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10';
    if (queue.position === 2) return 'text-amber-600 bg-amber-50 dark:bg-amber-500/10';
    return 'text-zinc-600 bg-zinc-50 dark:bg-zinc-500/10';
  };

  const getStatusText = (queue) => {
    if (queue.status === 'called') return "You're being served now!";
    if (queue.status === 'completed') return 'Your visit is complete. Thank you!';
    if (queue.status === 'skipped') return 'This queue entry was skipped.';
    if (queue.position === 1) return "You're next!";
    if (queue.position === 2) return '1 person ahead';
    if (queue.position != null && queue.position > 2) return `${queue.position - 1} people ahead`;
    return queue.status || 'In queue';
  };

  const statusBadgeVariant = (status) => {
    if (status === 'called') return 'called';
    if (status === 'completed') return 'completed';
    if (status === 'skipped') return 'skipped';
    if (status === 'cancelled') return 'cancelled';
    return 'waiting';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          My Queue
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Track your queue status in real-time
        </p>
      </div>

      {queues.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineUsers className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No Active Queues</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            You're not in any queue right now
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queues.map((queue) => (
            <div
              key={queue._id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <HiOutlineUsers className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Token {queue.tokenNumber}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {queue.business?.name}
                    </p>
                  </div>
                </div>
                <Badge variant={statusBadgeVariant(queue.status)}>
                  {queue.status === 'called' ? 'Being Served' : queue.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Position</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {queue.position != null ? `#${queue.position}` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Estimated Wait</span>
                  <span className="flex items-center gap-1 font-medium text-zinc-900 dark:text-zinc-100">
                    <HiOutlineClock className="w-4 h-4" />
                    {queue.estimatedWaitTime != null ? `${queue.estimatedWaitTime} min` : '—'}
                  </span>
                </div>
                {queue.peopleAhead != null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">People Ahead</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{queue.peopleAhead}</span>
                  </div>
                )}
                {queue.currentToken != null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Currently Serving</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">Q{String(queue.currentToken).padStart(3, '0')}</span>
                  </div>
                )}
                {queue.service && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Service</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{queue.service}{queue.staffName ? ` · ${queue.staffName}` : ''}</span>
                  </div>
                )}
              </div>

              <div className={`mt-4 p-3 rounded-xl ${getStatusColor(queue)}`}>
                <div className="flex items-center gap-2">
                  {queue.status === 'called' || queue.position <= 2 ? (
                    <HiOutlineBell className="w-4 h-4" />
                  ) : (
                    <HiOutlineTrendingUp className="w-4 h-4" />
                  )}
                  <span className="text-xs font-medium">{getStatusText(queue)}</span>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                {queue._id ? (
                  <>
                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-2 flex-shrink-0">
                      <QRCodeCanvas
                        value={`${window.location.origin}/queue/${queue._id}/scan`}
                        size={72}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                        ref={(node) => {
                          if (node) qrCanvasRefs.current[queue._id] = node;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <HiOutlineQrCode className="w-3.5 h-3.5 text-primary" />
                        Check-in Token
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                        Show this QR to the {queue.business?.name || 'business'} desk to verify your spot.
                      </p>
                      <p className="text-[10px] font-mono text-zinc-400 mt-1 truncate">Token Q{queue.tokenNumber}</p>
                      <button
                        onClick={() => downloadQR(queue)}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        <HiOutlineArrowDownTray className="w-3.5 h-3.5" /> Download QR
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <HiOutlineQrCode className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">QR unavailable</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        No check-in token is available for this queue yet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default QueuePage;
