import { motion } from 'framer-motion';
import Badge from '../../components/ui/Badge';
import { HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineCalendar, HiOutlineCash } from 'react-icons/hi';

const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'user', status: 'active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'business', status: 'active' },
  { id: 3, name: 'Carol Williams', email: 'carol@example.com', role: 'user', status: 'suspended' },
];

export default function AdminPage() {
  const stats = [
    { label: 'Total Users', value: '1,284', change: '+12%', icon: HiOutlineUsers },
    { label: 'Businesses', value: '48', change: '+3', icon: HiOutlineOfficeBuilding },
    { label: 'Appointments', value: '5,892', change: '+18%', icon: HiOutlineCalendar },
    { label: 'Revenue', value: '$12,400', change: '+22%', icon: HiOutlineCash },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-2">Manage the QueueBook platform.</p>
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
                <Icon className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
              <span className="text-xs font-medium text-emerald-600">{s.change}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Users</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-all">Businesses</button>
            <button className="px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">Reports</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-400 pb-3">Name</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-3">Email</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-3">Role</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-3">Status</th>
                <th className="text-right text-xs font-medium text-slate-400 pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-slate-50 last:border-0"
                >
                  <td className="py-3.5 text-sm font-semibold text-slate-800">{u.name}</td>
                  <td className="py-3.5 text-sm text-slate-500">{u.email}</td>
                  <td className="py-3.5"><Badge variant={u.role === 'admin' ? 'confirmed' : u.role === 'business' ? 'waiting' : 'pending'}>{u.role}</Badge></td>
                  <td className="py-3.5"><Badge variant={u.status === 'active' ? 'active' : 'cancelled'}>{u.status}</Badge></td>
                  <td className="py-3.5 text-right">
                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Manage</button>
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
