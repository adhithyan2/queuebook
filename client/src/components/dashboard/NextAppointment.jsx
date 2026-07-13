import { motion } from 'framer-motion';
import Badge from '../ui/Badge';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineLocationMarker, HiOutlineArrowRight } from 'react-icons/hi';
import { formatDate, formatTime, generateToken } from '../../utils/helpers';

const nextAppointment = {
  id: 1,
  business: 'City General Hospital',
  service: 'Cardiology Checkup',
  date: '2026-07-05T09:00:00',
  tokenNumber: 42,
  status: 'confirmed',
  address: '123 Medical Center Blvd, Suite 200',
};

export default function NextAppointment() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-8 card-shadow">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <HiOutlineCalendar className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Appointment</h2>
            <p className="text-sm text-slate-400">Your next scheduled visit</p>
          </div>
        </div>
        <Badge variant={nextAppointment.status}>{nextAppointment.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{nextAppointment.business}</h3>
          <p className="text-base text-slate-500 mb-6">{nextAppointment.service}</p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <HiOutlineCalendar className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="font-medium">{formatDate(nextAppointment.date)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <HiOutlineClock className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="font-medium">{formatTime(nextAppointment.date)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <HiOutlineLocationMarker className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="font-medium">{nextAppointment.address}</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-slate-500 mb-2">Queue Number</p>
          <p className="text-5xl font-bold text-indigo-600 mb-3">{generateToken(nextAppointment.tokenNumber)}</p>
          <p className="text-sm text-slate-400">Estimated wait: ~15 minutes</p>
        </div>
      </div>

      <button className="inline-flex items-center gap-2 px-7 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md">
        View Details
        <HiOutlineArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
