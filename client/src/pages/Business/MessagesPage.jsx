import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { notificationAPI } from '../../services/api';
import {
  HiOutlineChatAlt2, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineRefresh,
} from 'react-icons/hi';

export default function BusinessMessagesPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    try {
      const res = await notificationAPI.getMessageLogs();
      setLogs(res.data.logs || []);
    } catch (error) {
      console.error('Failed to fetch message logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const delivered = logs.filter((l) => l.status === 'sent').length;
  const failed = logs.filter((l) => l.status === 'failed').length;

  const statusBadge = (status) => {
    if (status === 'sent') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full">
          <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Delivered
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-full">
          <HiOutlineXCircle className="w-3.5 h-3.5" /> Failed
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 rounded-full">
        <HiOutlineXCircle className="w-3.5 h-3.5" /> No number
      </span>
    );
  };

  const channelLabel = (channel) =>
    channel === 'whatsapp' ? 'WhatsApp' : channel === 'sms' ? 'SMS' : 'Dev log';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Message Logs
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            SMS / WhatsApp delivery status sent to your customers
          </p>
        </div>
        <button
          onClick={() => fetchLogs(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          <HiOutlineRefresh className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{logs.length}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Total Messages</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 p-4">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{delivered}</p>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">Delivered</p>
        </div>
        <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20 p-4">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{failed}</p>
          <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">Failed</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineChatAlt2 className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No Messages Yet</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Notifications sent to customers with a verified phone number will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log._id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <HiOutlineChatAlt2 className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {log.user?.name || 'Walk-in'}
                      </p>
                      <span className="text-[11px] text-zinc-400">{log.to}</span>
                    </div>
                    {statusBadge(log.status)}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 whitespace-pre-line">
                    {log.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-medium rounded-full capitalize">
                      {log.type?.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-medium rounded-full">
                      {channelLabel(log.channel)}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {log.status === 'failed' && log.error && (
                    <p className="text-[10px] text-red-500 dark:text-red-400 mt-1">{log.error}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
