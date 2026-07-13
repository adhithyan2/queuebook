import { motion } from 'framer-motion';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { HiOutlineUsers, HiOutlineCheck, HiOutlineClock, HiOutlineXCircle } from 'react-icons/hi';

const todayQueue = [
  { token: 42, name: 'Alice Johnson', service: 'Cardiology', status: 'waiting', time: '09:00' },
  { token: 43, name: 'Bob Smith', service: 'General Checkup', status: 'waiting', time: '09:15' },
  { token: 44, name: 'Carol Williams', service: 'Cardiology', status: 'waiting', time: '09:30' },
  { token: 45, name: 'David Brown', service: 'X-Ray', status: 'called', time: '10:00' },
];

export default function BusinessDashboardPage() {
  const stats = [
    { label: 'Today\'s Queue', value: '24', change: '+8%', color: 'text-indigo-600', icon: HiOutlineUsers },
    { label: 'Completed', value: '18', change: '+12%', color: 'text-emerald-600', icon: HiOutlineCheck },
    { label: 'Avg Wait Time', value: '12 min', change: '-3 min', color: 'text-amber-600', icon: HiOutlineClock },
    { label: 'No-Shows', value: '2', change: '-1', color: 'text-red-600', icon: HiOutlineXCircle },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Business Dashboard</h1>
        <p className="text-slate-500 mt-2">Manage your queue and appointments.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow min-h-[160px] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
              <span className={`text-xs font-medium ${s.color}`}>{s.change}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Today's Queue</h2>
          <Button variant="gradient" size="sm">Call Next</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-400 pb-3">Token</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-3">Customer</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-3">Service</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-3">Time</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-3">Status</th>
                <th className="text-right text-xs font-medium text-slate-400 pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {todayQueue.map((item, i) => (
                <motion.tr
                  key={item.token}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-slate-50 last:border-0"
                >
                  <td className="py-3.5 text-sm font-bold text-slate-800">Q{String(item.token).padStart(3, '0')}</td>
                  <td className="py-3.5 text-sm text-slate-700">{item.name}</td>
                  <td className="py-3.5 text-sm text-slate-500">{item.service}</td>
                  <td className="py-3.5 text-sm text-slate-500">{item.time}</td>
                  <td className="py-3.5"><Badge variant={item.status}>{item.status}</Badge></td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Complete">
                        <HiOutlineCheck className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Skip">
                        <HiOutlineXCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
