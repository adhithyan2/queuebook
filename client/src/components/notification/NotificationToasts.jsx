import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBell, HiOutlineUsers, HiOutlineCalendar, HiOutlineCheckCircle, HiOutlineX,
} from 'react-icons/hi';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const TOAST_DURATION = 6000;

const ICONS = {
  queue: HiOutlineUsers,
  appointment: HiOutlineCalendar,
  system: HiOutlineBell,
};

function routeFor(role, type) {
  if (role === 'business') {
    if (type === 'appointment') return '/business/dashboard';
    if (type === 'queue') return '/business/queue';
    return '/business/dashboard';
  }
  if (type === 'appointment') return '/customer/appointments';
  if (type === 'queue') return '/customer/queue';
  return '/customer/notifications';
}

export default function NotificationToasts() {
  const socket = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;
    const timerMap = timers.current;
    const handleNotification = (notification) => {
      const id = notification._id || `${Date.now()}-${Math.random()}`;
      setToasts((prev) => {
        if (prev.some((t) => t.id === id)) return prev;
        return [...prev.slice(-3), { id, ...notification }];
      });
      const timer = setTimeout(() => dismiss(id), TOAST_DURATION);
      timerMap.set(id, timer);
    };
    socket.on('new-notification', handleNotification);
    return () => {
      socket.off('new-notification', handleNotification);
      timerMap.forEach((t) => clearTimeout(t));
      timerMap.clear();
    };
  }, [socket, dismiss]);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-[min(92vw,380px)] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || HiOutlineBell;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={() => {
                dismiss(toast.id);
                navigate(routeFor(user?.role, toast.type));
              }}
              className="pointer-events-auto bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-[0_12px_40px_rgba(15,23,42,0.14)] p-4 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {toast.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-3">
                    {toast.message}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismiss(toast.id);
                  }}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex-shrink-0 p-0.5"
                  aria-label="Dismiss notification"
                >
                  <HiOutlineX className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-1 mt-2 text-[11px] text-primary font-medium">
                <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                View details
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
