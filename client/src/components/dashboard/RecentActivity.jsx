import { motion } from 'framer-motion';
import { HiOutlineCalendar, HiOutlineClipboardCheck, HiOutlineStar, HiOutlineClock } from 'react-icons/hi';

const activities = [
  { id: 1, action: 'Appointment booked at City General Hospital', detail: 'Cardiology Checkup - Jul 5, 9:00 AM', icon: HiOutlineCalendar, color: 'text-indigo-600', bg: 'bg-indigo-50', time: '2 hours ago' },
  { id: 2, action: 'Queue position updated', detail: '3 people ahead at Bright Smile Dental', icon: HiOutlineClipboardCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', time: '1 hour ago' },
  { id: 3, action: 'Review submitted', detail: '5-star review for Bright Smile Dental', icon: HiOutlineStar, color: 'text-amber-600', bg: 'bg-amber-50', time: '3 hours ago' },
  { id: 4, action: 'Appointment completed', detail: 'Teeth Cleaning at Bright Smile Dental', icon: HiOutlineClock, color: 'text-violet-600', bg: 'bg-violet-50', time: 'Yesterday' },
];

export default function RecentActivity() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Recent Activity</h2>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
        <div className="space-y-1">
          {activities.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{item.action}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{item.time}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
