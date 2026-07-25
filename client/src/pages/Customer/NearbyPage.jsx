import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { customerAPI } from '../../services/api';
import { HiOutlineLocationMarker, HiOutlineStar, HiOutlineSearch, HiOutlineRefresh, HiOutlineExclamationCircle } from 'react-icons/hi';

const categoryColors = {
  hospital: '#EF4444', clinic: '#8B5CF6', salon: '#EC4899',
  restaurant: '#F59E0B', office: '#3B82F6', laboratory: '#10B981',
};

const statusConfig = {
  detecting: { icon: HiOutlineLocationMarker, text: 'Detecting your location...', color: '#6C4CF1' },
  granted: { icon: HiOutlineLocationMarker, text: 'Showing nearby services', color: '#10B981' },
  denied: { icon: HiOutlineExclamationCircle, text: 'Location denied — showing all', color: '#F59E0B' },
  unavailable: { icon: HiOutlineExclamationCircle, text: 'Geolocation not supported', color: '#F59E0B' },
};

function formatDistance(meters) {
  if (!meters) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function CustomerNearbyPage() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('detecting');

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationStatus('unavailable'); return; }
    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationStatus('granted'); },
      () => { setLocationStatus('denied'); setLocation(null); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => { detectLocation(); }, [detectLocation]);

  useEffect(() => {
    setLoading(true);
    const params = { search };
    if (location) { params.lat = location.lat; params.lng = location.lng; }
    customerAPI.getNearby(params)
      .then(res => setBusinesses(res.data.businesses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, location]);

  const StatusIcon = statusConfig[locationStatus].icon;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Nearby Services</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Discover businesses near you with live queue information.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input type="text" placeholder="Search nearby..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
        </div>
        <div className="flex items-center gap-2 px-4 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl">
          <StatusIcon className="w-4 h-4" style={{ color: statusConfig[locationStatus].color }} />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{statusConfig[locationStatus].text}</span>
          {locationStatus === 'denied' && (
            <button onClick={detectLocation} className="ml-1 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <HiOutlineRefresh className="w-4 h-4 text-primary" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {businesses.length > 0 ? businesses.map((biz, i) => (
            <motion.div key={biz._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }} whileHover={{ y: -4 }}
              className="bg-white dark:bg-slate-800 rounded-[20px] border border-slate-100 dark:border-slate-700 p-6 card-shadow card-shadow-hover cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${categoryColors[biz.category] || '#6C4CF1'}15` }}>
                  <HiOutlineLocationMarker className="w-6 h-6" style={{ color: categoryColors[biz.category] || '#6C4CF1' }} />
                </div>
                {biz.distance && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {formatDistance(biz.distance)}
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">{biz.name}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 capitalize mb-1">{biz.category}</p>
              {biz.address && <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 line-clamp-2">{biz.address}</p>}
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1">
                  <HiOutlineStar className="w-3.5 h-3.5 text-amber-400 fill-current" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{biz.rating?.toFixed(1) || 'New'}</span>
                </div>
                <button onClick={() => navigate(`/customer/book/${biz._id}`)}
                  className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors">Book Now</button>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full text-center py-16">
              <HiOutlineLocationMarker className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No businesses found</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
