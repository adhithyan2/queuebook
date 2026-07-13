import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { customerAPI } from '../../services/api';
import { HiOutlineLocationMarker, HiOutlineStar, HiOutlineSearch, HiOutlineRefresh, HiOutlineExclamationCircle } from 'react-icons/hi';

const categoryColors = {
  hospital: '#EF4444',
  clinic: '#8B5CF6',
  salon: '#EC4899',
  restaurant: '#F59E0B',
  office: '#3B82F6',
  laboratory: '#10B981',
};

const statusConfig = {
  detecting: { icon: HiOutlineLocationMarker, text: 'Detecting your location...', color: '#6366F1' },
  granted: { icon: HiOutlineLocationMarker, text: 'Showing nearby services', color: '#10B981' },
  denied: { icon: HiOutlineExclamationCircle, text: 'Location access denied — showing all services', color: '#F59E0B' },
  unavailable: { icon: HiOutlineExclamationCircle, text: 'Geolocation not supported — showing all services', color: '#F59E0B' },
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
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }
    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => {
        setLocationStatus('denied');
        setLocation(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => { detectLocation(); }, [detectLocation]);

  useEffect(() => {
    setLoading(true);
    const params = { search };
    if (location) {
      params.lat = location.lat;
      params.lng = location.lng;
    }
    customerAPI.getNearby(params)
      .then(res => setBusinesses(res.data.businesses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, location]);

  const StatusIcon = statusConfig[locationStatus].icon;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900">Nearby Services</h1>
        <p className="text-slate-500 mt-2">Discover businesses near you with live queue information.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search nearby..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-[56px] pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 px-4 h-[52px] bg-white border border-slate-200 rounded-xl">
          <StatusIcon className="w-4 h-4" style={{ color: statusConfig[locationStatus].color }} />
          <span className="text-xs text-slate-500">{statusConfig[locationStatus].text}</span>
          {locationStatus === 'denied' && (
            <button onClick={detectLocation} className="ml-1 p-1 rounded-lg hover:bg-slate-100 transition-colors">
              <HiOutlineRefresh className="w-4 h-4 text-indigo-500" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.length > 0 ? businesses.map((biz, i) => (
            <motion.div
              key={biz._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow card-shadow-hover cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${categoryColors[biz.category] || '#6366F1'}15` }}>
                  <HiOutlineLocationMarker className="w-6 h-6" style={{ color: categoryColors[biz.category] || '#6366F1' }} />
                </div>
                {biz.distance && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {formatDistance(biz.distance)}
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">{biz.name}</h3>
              <p className="text-xs text-slate-400 capitalize mb-1">{biz.category}</p>
              {biz.address && <p className="text-xs text-slate-400 mb-5">{biz.address}</p>}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <HiOutlineStar className="w-3.5 h-3.5 text-amber-400 fill-current" />
                  <span className="text-sm font-semibold text-slate-700">{biz.rating?.toFixed(1) || 'New'}</span>
                </div>
                <button onClick={() => navigate(`/customer/book/${biz._id}`)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Book Now</button>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full text-center py-16">
              <p className="text-sm text-slate-500">No businesses found</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
