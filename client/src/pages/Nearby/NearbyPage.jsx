import { motion } from 'framer-motion';
import { HiOutlineLocationMarker, HiOutlineStar, HiOutlineSearch } from 'react-icons/hi';

const places = [
  { name: 'City General Hospital', type: 'Hospital', distance: '0.8 km', rating: 4.5, wait: '15 min', color: '#EF4444', address: '123 Main St, Downtown' },
  { name: 'Bright Smile Dental', type: 'Dental Clinic', distance: '1.2 km', rating: 4.8, wait: '10 min', color: '#8B5CF6', address: '456 Oak Ave' },
  { name: 'Style Studio Salon', type: 'Salon', distance: '0.5 km', rating: 4.3, wait: '20 min', color: '#EC4899', address: '789 Pine Rd' },
  { name: 'Green Leaf Restaurant', type: 'Restaurant', distance: '0.3 km', rating: 4.6, wait: '25 min', color: '#F59E0B', address: '321 Elm St' },
  { name: 'Central Lab', type: 'Laboratory', distance: '1.5 km', rating: 4.2, wait: '5 min', color: '#3B82F6', address: '555 Cedar Ln' },
  { name: 'City Hall', type: 'Government Office', distance: '2.0 km', rating: 3.9, wait: '45 min', color: '#10B981', address: '100 Government Plaza' },
];

export default function NearbyPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Nearby Services</h1>
        <p className="text-slate-500 mt-2">Discover businesses near you with live queue information.</p>
      </div>

      <div className="relative max-w-md mb-8">
        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search nearby..."
          className="w-full h-[52px] pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {places.map((place, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow card-shadow-hover cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${place.color}15` }}>
                <HiOutlineLocationMarker className="w-6 h-6" style={{ color: place.color }} />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{place.wait}</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{place.name}</h3>
            <p className="text-xs text-slate-400 mb-1">{place.type} &middot; {place.distance}</p>
            <p className="text-xs text-slate-400 mb-5">{place.address}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <HiOutlineStar className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span className="text-sm font-semibold text-slate-700">{place.rating}</span>
              </div>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Book Now</button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
