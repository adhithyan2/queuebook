import { motion } from 'framer-motion';
import { HiOutlineLocationMarker, HiOutlineStar } from 'react-icons/hi';

const places = [
  { name: 'City General Hospital', type: 'Hospital', distance: '0.8 km', rating: 4.5, wait: '15 min', color: '#EF4444', initials: 'CG' },
  { name: 'Bright Smile Dental', type: 'Dental Clinic', distance: '1.2 km', rating: 4.8, wait: '10 min', color: '#8B5CF6', initials: 'BS' },
  { name: 'Style Studio Salon', type: 'Salon', distance: '0.5 km', rating: 4.3, wait: '20 min', color: '#EC4899', initials: 'SS' },
];

export default function NearbyWidget() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Nearby Services</h3>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700">View all</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {places.map((place, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                style={{ backgroundColor: place.color }}
              >
                {place.initials}
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{place.wait}</span>
            </div>
            <h4 className="text-base font-semibold text-slate-900 mb-1">{place.name}</h4>
            <p className="text-xs text-slate-400 mb-1">{place.type}</p>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <HiOutlineLocationMarker className="w-3 h-3" /> {place.distance}
                </span>
                <span className="flex items-center gap-0.5 text-xs font-medium text-slate-600">
                  <HiOutlineStar className="w-3 h-3 text-amber-400 fill-current" /> {place.rating}
                </span>
              </div>
              <button className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition-all">
                Book
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
