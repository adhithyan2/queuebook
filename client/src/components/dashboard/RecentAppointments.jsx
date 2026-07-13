import { motion } from 'framer-motion';
import Badge from '../ui/Badge';
import { HiOutlineArrowRight } from 'react-icons/hi';
import { formatDate, generateToken } from '../../utils/helpers';

const recentAppointments = [
  { id: 1, business: 'City General Hospital', service: 'Cardiology Checkup', date: '2026-07-05T09:00:00', tokenNumber: 42, status: 'confirmed' },
  { id: 2, business: 'Bright Smile Dental', service: 'Teeth Cleaning', date: '2026-07-08T14:30:00', tokenNumber: 18, status: 'pending' },
  { id: 3, business: 'Style Studio Salon', service: 'Haircut & Styling', date: '2026-06-28T11:00:00', tokenNumber: 7, status: 'completed' },
  { id: 4, business: 'City General Hospital', service: 'Blood Test', date: '2026-06-25T08:00:00', tokenNumber: 103, status: 'cancelled' },
];

export default function RecentAppointments() {
  if (recentAppointments.length === 0) {
    return (
      <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-5">Recent Appointments</h2>
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <p className="text-sm font-medium text-slate-600">No appointments yet</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Recent Appointments</h2>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden card-shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Date</th>
              <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Business</th>
              <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Status</th>
              <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Queue #</th>
              <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {recentAppointments.map((apt, i) => (
              <motion.tr
                key={apt.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all"
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-700">{formatDate(apt.date)}</span>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{apt.business}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{apt.service}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={apt.status}>{apt.status}</Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-indigo-600">{generateToken(apt.tokenNumber)}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-all">
                    View <HiOutlineArrowRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
