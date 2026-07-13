import { motion } from 'framer-motion';
import Badge from '../ui/Badge';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineLocationMarker } from 'react-icons/hi';
import { formatDate, formatTime, generateToken } from '../../utils/helpers';

const appointments = [
  { id: 1, business: 'City General Hospital', service: 'Cardiology Checkup', date: '2026-07-05T09:00:00', tokenNumber: 42, status: 'confirmed' },
  { id: 2, business: 'Bright Smile Dental', service: 'Teeth Cleaning', date: '2026-07-08T14:30:00', tokenNumber: 18, status: 'pending' },
];

export default function AppointmentList() {
  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
          <HiOutlineCalendar className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-600">No upcoming appointments</p>
        <p className="text-xs text-slate-400 mt-1">Book a service to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((apt, i) => (
        <motion.div
          key={apt.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 card-shadow card-shadow-hover cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <HiOutlineCalendar className="w-6 h-6 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-800 truncate">{apt.business}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{apt.service}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <HiOutlineCalendar className="w-3.5 h-3.5" /> {formatDate(apt.date)}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <HiOutlineClock className="w-3.5 h-3.5" /> {formatTime(apt.date)}
              </span>
              <span className="text-xs font-bold text-indigo-600">{generateToken(apt.tokenNumber)}</span>
            </div>
          </div>
          <Badge variant={apt.status}>{apt.status}</Badge>
        </motion.div>
      ))}
    </div>
  );
}
