import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HiOutlineSearch, HiOutlineStar, HiOutlineLocationMarker, HiOutlinePhone, HiOutlineUsers, HiOutlineClock } from 'react-icons/hi';
import { customerAPI } from '../../services/api';
import VerifiedBadge from '../../components/ui/VerifiedBadge';

const categories = ['All', 'Hospital', 'Clinic', 'Salon', 'Restaurant', 'Office', 'Laboratory'];

const purpleIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 34px; height: 34px; border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    background: #6D5EF7;
    border: 2.5px solid #ffffff;
    box-shadow: 0 6px 18px rgba(109, 94, 247, 0.45);
    display: flex; align-items: center; justify-content: center;
  "><div style="
    width: 12px; height: 12px; border-radius: 50%;
    background: #ffffff; transform: rotate(45deg);
  "></div></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 18px; height: 18px; border-radius: 50%;
    background: #3B82F6; border: 3px solid #ffffff;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapController({ center, userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 13, { duration: 0.8 });
    } else if (center) {
      map.setView(center, 12);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.lat, userLocation?.lng]);
  return null;
}

function formatDistance(km) {
  if (km === null || km === undefined) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${Number(km).toFixed(1)} km`;
}

const NearbyPage = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [manualQuery, setManualQuery] = useState('');

  useEffect(() => {
    fetchNearby();
  }, []);

  const fetchNearby = async (location) => {
    try {
      const params = {};
      if (location) {
        params.lat = location.lat;
        params.lng = location.lng;
      }
      const response = await customerAPI.getExplore(params);
      setBusinesses(response.data.businesses || []);
    } catch (error) {
      console.error('Failed to fetch nearby businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocationStatus('granted');
        fetchNearby(loc);
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 6000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocationStatus('granted');
        setManualQuery('');
        fetchNearby(loc);
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const applyManualLocation = async (e) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    setLocationStatus('locating');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(manualQuery)}`
      );
      const data = await res.json();
      if (data?.length) {
        const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setUserLocation(loc);
        setLocationStatus('manual');
        fetchNearby(loc);
      } else {
        setLocationStatus('denied');
      }
    } catch {
      setLocationStatus('denied');
    }
  };

  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch = business.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || business.category?.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const center = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    const first = businesses.find((b) => b.location?.coordinates?.some((c) => c !== 0));
    if (first?.location?.coordinates) {
      return [first.location.coordinates[1], first.location.coordinates[0]];
    }
    return [20.5937, 78.9629];
  }, [userLocation, businesses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Nearby Services
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Find and book services around you
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <HiOutlineLocationMarker className={`w-4 h-4 ${locationStatus === 'granted' || locationStatus === 'manual' ? 'text-emerald-500' : 'text-primary'}`} />
            {locationStatus === 'granted' && 'Using your location'}
            {locationStatus === 'manual' && 'Using manual location'}
            {locationStatus === 'locating' && 'Locating…'}
            {locationStatus === 'denied' && 'Location unavailable'}
            {locationStatus === 'idle' && 'Location off'}
          </span>
          <button
            onClick={locateMe}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/5 transition-colors"
          >
            <HiOutlineLocationMarker className="w-3.5 h-3.5" />
            {locationStatus === 'granted' || locationStatus === 'manual' ? 'Relocate' : 'Enable Location'}
          </button>
        </div>

        <AnimatePresence>
          {locationStatus === 'denied' && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={applyManualLocation}
              className="mt-4 overflow-hidden"
            >
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                Permission denied. Enter an area, city or landmark to find services around it:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="e.g. Delhi, Bengaluru, MG Road…"
                  className="flex-1 px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-white text-xs font-semibold bg-primary hover:bg-primary/90 transition-colors"
                >
                  Search
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <HiOutlineLocationMarker className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Interactive Map</span>
          {userLocation && (
            <span className="text-xs text-zinc-400 ml-auto">Tap a marker for details</span>
          )}
        </div>
        <div className="relative h-[360px] w-full z-0">
          {!userLocation && (
            <div className="absolute inset-0 z-[1000] bg-white/85 dark:bg-zinc-900/85 backdrop-blur-sm flex items-center justify-center px-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <HiOutlineLocationMarker className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Location unavailable</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-[260px]">
                  Enable location or enter an area above to see services around you on the map.
                </p>
              </div>
            </div>
          )}
          <MapContainer
            center={center}
            zoom={12}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userLocation && (
              <>
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={800}
                  pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.08, weight: 1.5 }}
                />
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                  <Popup>You are here</Popup>
                </Marker>
              </>
            )}
            {filteredBusinesses
              .filter((b) => b.location?.coordinates?.some((c) => c !== 0))
              .map((b) => {
                const [lng, lat] = b.location.coordinates;
                return (
                  <Marker
                    key={b._id}
                    position={[lat, lng]}
                    icon={purpleIcon}
                    eventHandlers={{ click: () => navigate(`/b/${b._id}`) }}
                  >
                    <Popup>
                      <div style={{ minWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#18181b' }}>
                          {b.name}
                          <VerifiedBadge className="text-[#6D5EF7]" />
                        </div>
                        <div style={{ fontSize: 12, color: '#71717a', textTransform: 'capitalize', margin: '2px 0 6px' }}>
                          {b.category} · {formatDistance(b.distanceKm)}
                        </div>
                        <div style={{ fontSize: 12, color: '#52525b', lineHeight: 1.7 }}>
                          {b.liveQueue?.waiting ?? 0} waiting · ~{b.liveQueue?.estimatedWaitTime ?? '—'} min
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            <MapController center={center} userLocation={userLocation} />
          </MapContainer>
        </div>
      </div>

      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search businesses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
              activeCategory === category
                ? 'bg-primary text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {filteredBusinesses.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineLocationMarker className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No Results Found</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Try adjusting your search or filter
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBusinesses.map((business) => (
            <div
              key={business._id || business.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <HiOutlineLocationMarker className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                      {business.name}
                      <VerifiedBadge />
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{business.category}</p>
                  </div>
                </div>
                {business.phone && (
                  <button className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <HiOutlinePhone className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <HiOutlineStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {business.averageRating ? business.averageRating.toFixed(1) : business.rating || '—'}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <HiOutlineUsers className="w-3.5 h-3.5 text-primary" />
                  {business.liveQueue?.waiting ?? 0} waiting
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <HiOutlineClock className="w-3.5 h-3.5 text-primary" />
                  {business.liveQueue?.estimatedWaitTime ?? '—'} min
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {business.distanceKm !== null && business.distanceKm !== undefined
                    ? formatDistance(business.distanceKm)
                    : business.address || 'Distance unavailable'}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/b/${business._id}`)}
                  className="flex-1 py-2.5 text-xs font-medium border border-primary/30 text-primary rounded-xl hover:bg-primary/5 transition-colors"
                >
                  View Queue
                </button>
                <button
                  onClick={() => navigate(`/customer/book/${business._id}`)}
                  className="flex-1 py-2.5 text-xs font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default NearbyPage;
