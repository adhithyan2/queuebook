import { motion } from 'framer-motion';
import { SERVICES } from '../../utils/constants';
import { HiOutlineArrowRight } from 'react-icons/hi';

const iconMap = {
  FaHospital: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  FaTooth: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  FaCut: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
  FaUtensils: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
  FaLandmark: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  FaFlask: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
};

const descriptions = {
  hospitals: 'Find hospitals and book appointments',
  clinics: 'Schedule dental checkups and cleanings',
  salons: 'Book haircuts, styling, and beauty services',
  restaurants: 'Reserve tables and skip the wait',
  offices: 'Visit government offices efficiently',
  laboratories: 'Schedule lab tests and screenings',
};

export default function ServiceCategories() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-slate-900">Book a Service</h2>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          View all <HiOutlineArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {SERVICES.map((service, i) => (
          <motion.button
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="group bg-white rounded-2xl border border-slate-100 p-6 min-h-[160px] card-shadow card-shadow-hover text-left"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
              style={{ backgroundColor: `${service.color}15` }}
            >
              <svg className="w-7 h-7" style={{ color: service.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={iconMap[service.icon] || iconMap.FaHospital} />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">{service.name}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{descriptions[service.id] || 'Book a service'}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
