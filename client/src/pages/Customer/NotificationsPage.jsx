import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { notificationAPI } from '../../services/api';
import { HiOutlineBell, HiOutlineClock } from 'react-icons/hi';

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    notificationAPI.getAll()
      .then(res => setNotifications(res.data.notifications))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const getTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const unread = notifications.filter(n => !n.read).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-2">Stay updated with your queue and appointment alerts.</p>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length > 0 ? notifications.map((n, i) => (
          <motion.div
            key={n._id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => !n.read && handleMarkRead(n._id)}
            className={`flex items-start gap-5 p-5 rounded-2xl transition-all cursor-pointer ${
              n.read ? 'bg-white border border-slate-100' : 'bg-indigo-50/60 border border-indigo-100'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              n.read ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600'
            }`}>
              <HiOutlineBell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className={`text-sm font-semibold ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</h4>
                <span className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0 ml-2">
                  <HiOutlineClock className="w-3 h-3" /> {getTimeAgo(n.createdAt)}
                </span>
              </div>
              <p className="text-sm text-slate-500">{n.message}</p>
            </div>
            {!n.read && <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-2" />}
          </motion.div>
        )) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <HiOutlineBell className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">No notifications yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
