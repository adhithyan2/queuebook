import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineBell, HiOutlineCheck, HiOutlineChatAlt2, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';
import { notificationAPI } from '../../services/api';

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('inapp');
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    fetchMessageLogs();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageLogs = async () => {
    try {
      const response = await notificationAPI.getMessageLogs();
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Failed to fetch message logs:', error);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const statusLabel = {
    sent: { text: 'Delivered', className: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', icon: <HiOutlineCheckCircle className="w-3.5 h-3.5" /> },
    failed: { text: 'Failed', className: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400', icon: <HiOutlineXCircle className="w-3.5 h-3.5" /> },
    skipped: { text: 'No number', className: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400', icon: <HiOutlineXCircle className="w-3.5 h-3.5" /> },
  };

  const channelLabel = (channel) =>
    channel === 'whatsapp' ? 'WhatsApp' : channel === 'sms' ? 'SMS' : 'Dev log';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Stay updated with your activities
          </p>
        </div>
        {activeTab === 'inapp' && unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 rounded-lg transition-colors"
          >
            <HiOutlineCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('inapp')}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'inapp'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          <HiOutlineBell className="w-3.5 h-3.5" />
          In-App
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold">{unreadCount}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'logs'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          <HiOutlineChatAlt2 className="w-3.5 h-3.5" />
          SMS / WhatsApp
        </button>
      </div>

      {activeTab === 'inapp' ? (
        notifications.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <HiOutlineBell className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No Notifications</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              You're all caught up!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => !notification.read && handleMarkRead(notification._id)}
                className={`bg-white dark:bg-zinc-900 rounded-2xl border p-4 cursor-pointer transition-colors ${
                  notification.read
                    ? 'border-zinc-100 dark:border-zinc-800'
                    : 'border-primary/30 bg-primary/5 dark:bg-primary/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    notification.read
                      ? 'bg-zinc-100 dark:bg-zinc-800'
                      : 'bg-primary/10'
                  }`}>
                    <HiOutlineBell className={`w-4 h-4 ${
                      notification.read
                        ? 'text-zinc-400'
                        : 'text-primary'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        notification.read
                          ? 'text-zinc-600 dark:text-zinc-400'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineChatAlt2 className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No SMS / WhatsApp Messages</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Verify your phone number in your profile to receive queue updates by SMS or WhatsApp.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const status = statusLabel[log.status] || statusLabel.skipped;
            return (
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
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                        {log.type?.replace(/_/g, ' ')}
                      </p>
                      <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full flex-shrink-0 ${status.className}`}>
                        {status.icon}
                        {status.text}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 whitespace-pre-line">
                      {log.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-medium rounded-full">
                        {channelLabel(log.channel)}
                      </span>
                      {log.to && (
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-medium rounded-full">
                          {log.to}
                        </span>
                      )}
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
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default NotificationsPage;
