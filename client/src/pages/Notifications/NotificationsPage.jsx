import { motion } from 'framer-motion';
import { HiOutlineBell, HiOutlineClock } from 'react-icons/hi';
import { getTimeAgo } from '../../utils/helpers';

const notifications = [
  { id: 1, title: 'Queue Update', message: 'You are next in line at City General Hospital.', time: new Date(Date.now() - 120000), read: false },
  { id: 2, title: 'Appointment Confirmed', message: 'Your appointment at Bright Smile Dental is confirmed for Jul 8.', time: new Date(Date.now() - 3600000), read: false },
  { id: 3, title: 'Token Assigned', message: 'Your token Q047 has been assigned at Style Studio Salon.', time: new Date(Date.now() - 7200000), read: true },
  { id: 4, title: 'Queue Moving Fast', message: 'Only 2 people ahead of you at Green Leaf Restaurant.', time: new Date(Date.now() - 10800000), read: true },
];

export default function NotificationsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Notifications</h1>
        <p className="text-slate-500 mt-2">Stay updated with your queue and appointment alerts.</p>
      </div>

      <div className="space-y-3">
        {notifications.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
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
                  <HiOutlineClock className="w-3 h-3" /> {getTimeAgo(n.time)}
                </span>
              </div>
              <p className="text-sm text-slate-500">{n.message}</p>
            </div>
            {!n.read && <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-2" />}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
