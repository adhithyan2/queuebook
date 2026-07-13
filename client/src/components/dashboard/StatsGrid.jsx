import { motion } from 'framer-motion';

const stats = [
  { label: 'Total Appointments', value: '12', change: '+2 this week', color: 'text-indigo-600', bg: 'bg-indigo-50', iconBg: 'bg-indigo-100' },
  { label: 'Queue Visits', value: '28', change: '+5 this week', color: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100' },
  { label: 'Hours Saved', value: '4.5h', change: '~30min/visit', color: 'text-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-100' },
  { label: 'Reviews', value: '5', change: '4.9 avg rating', color: 'text-violet-600', bg: 'bg-violet-50', iconBg: 'bg-violet-100' },
];

export default function StatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow min-h-[180px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
              <svg className={`w-6 h-6 ${stat.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            <p className={`text-xs font-medium mt-1.5 ${stat.color}`}>{stat.change}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
