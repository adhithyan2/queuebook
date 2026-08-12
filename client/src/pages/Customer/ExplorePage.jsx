import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  HiOutlineMapPin, HiOutlineStar, HiOutlineUsers, HiOutlineClock,
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineSparkles,
  HiOutlineCalendar,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import { HiOutlineSearch, HiOutlineLocationMarker } from 'react-icons/hi';
import { customerAPI } from '../../services/api';
import VerifiedBadge from '../../components/ui/VerifiedBadge';
import { useSocket } from '../../context/SocketContext';

const ACCENT = '#6D5EF7';
const categories = ['All', 'Hospital', 'Clinic', 'Salon', 'Restaurant', 'Office', 'Laboratory'];

const purpleIcon = (active) => L.divIcon({
  className: '',
  html: `<div style="
    width: 34px; height: 34px; border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    background: ${active ? '#7C3AED' : '#6D5EF7'};
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

function MapController({ center, selectedBusiness, userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (selectedBusiness?.location?.coordinates) {
      map.flyTo([selectedBusiness.location.coordinates[1], selectedBusiness.location.coordinates[0]], 14, { duration: 0.8 });
    } else if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 13, { duration: 0.8 });
    } else if (center) {
      map.setView(center, 12);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBusiness?._id]);
  return null;
}

function formatDistance(km) {
  if (km === null || km === undefined) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function ServiceCard({ business, isBest, onSelect }) {
  const navigate = useNavigate();
  const coordsValid = business.location?.coordinates?.some((c) => c !== 0);
  const isOpen = business.isOpen;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => coordsValid && onSelect(business)}
      className={`bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(15,23,42,0.06)] border transition-all duration-200 cursor-pointer hover:shadow-[0_10px_36px_rgba(109,94,247,0.14)] hover:-translate-y-0.5 ${
        isBest ? 'border-[#6D5EF7]/60 ring-1 ring-[#6D5EF7]/40' : 'border-zinc-100'
      }`}
    >
      {isBest && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#6D5EF7]/10 text-[#6D5EF7] text-[11px] font-semibold mb-3">
          <HiOutlineSparkles className="w-3.5 h-3.5" />
          Best option for you
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-zinc-900 flex items-center gap-1.5 flex-wrap">
            {business.name}
            <VerifiedBadge className="text-[#6D5EF7]" />
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5 capitalize">{business.category}</p>
        </div>
        <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
          isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
          {isOpen ? 'Open' : 'Closed'}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-1">
          <HiOutlineStar className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-sm font-semibold text-zinc-800">{business.averageRating?.toFixed(1) || '—'}</span>
          <span className="text-xs text-zinc-400">({business.reviewCount || 0})</span>
        </div>
        <span className="text-zinc-200">|</span>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <HiOutlineMapPin className="w-4 h-4 text-[#6D5EF7]" />
          <span className="font-medium text-zinc-700">{formatDistance(business.distanceKm)}</span>
          {business.travelTimeMin !== null && (
            <span className="text-zinc-400">· {business.travelTimeMin} min drive</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#6D5EF7]/[0.06] rounded-2xl p-3 text-center">
          <p className="text-[10px] text-zinc-400 mb-1">Waiting</p>
          <p className="text-lg font-bold text-zinc-900 flex items-center justify-center gap-1">
            {business.liveQueue.waiting}
            <HiOutlineUsers className="w-3.5 h-3.5 text-zinc-300" />
          </p>
        </div>
        <div className="bg-[#6D5EF7]/[0.06] rounded-2xl p-3 text-center">
          <p className="text-[10px] text-zinc-400 mb-1">Est. Wait</p>
          <p className="text-lg font-bold text-zinc-900 flex items-center justify-center gap-1">
            {business.liveQueue.estimatedWaitTime}
            <span className="text-[11px] font-medium text-zinc-400">min</span>
          </p>
        </div>
        <div className="bg-[#6D5EF7]/[0.06] rounded-2xl p-3 text-center">
          <p className="text-[10px] text-zinc-400 mb-1">Serving</p>
          <p className="text-lg font-bold text-[#6D5EF7]">
            {business.liveQueue.currentToken ? `Q${String(business.liveQueue.currentToken).padStart(3, '0')}` : '—'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <HiOutlineCalendar className="w-4 h-4 text-[#6D5EF7]" />
          <span>
            {business.availableSlots > 0
              ? <span className="text-emerald-600 font-medium">{business.availableSlots} slots available today</span>
              : <span className="text-amber-500 font-medium">Fully booked today</span>}
          </span>
        </div>
        {business.openTime && (
          <span className="text-[11px] text-zinc-400">{business.openTime}–{business.closeTime}</span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/b/${business._id}`)}
          className="flex-1 py-2.5 rounded-xl border border-[#6D5EF7]/30 text-[#6D5EF7] text-xs font-semibold hover:bg-[#6D5EF7]/5 transition-colors"
        >
          View Queue
        </button>
        <button
          onClick={() => navigate(`/customer/book/${business._id}`)}
          className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` }}
        >
          Book Now
        </button>
      </div>
    </motion.div>
  );
}

function RecommendationBanner({ recommendation, userLocation }) {
  const navigate = useNavigate();
  const b = recommendation?.business;
  if (!b) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] p-6 text-white relative overflow-hidden"
      style={{ background: `linear-gradient(120deg, ${ACCENT}, #8B5CF6 60%, #7C3AED)` }}
    >
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute right-16 -bottom-10 w-32 h-32 rounded-full bg-white/10" />

      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
          <HiOutlineSparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Smart Recommendation</p>
          <p className="text-sm font-bold">Best option for you</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-3">
        <div className="flex-1 min-w-0">
          <p className="text-xl font-extrabold flex items-center gap-2 flex-wrap">
            {b.name}
            <span className="text-[#fff]/90"><VerifiedBadge className="text-white/90" /></span>
          </p>
          <p className="text-sm text-white/85 mt-1 flex items-center gap-1.5">
            <HiOutlineClock className="w-4 h-4" />
            {recommendation.message}
          </p>
          {recommendation.leaveMessage && (
            <p className="text-sm text-white/90 mt-1 flex items-center gap-1.5">
              <HiOutlineMapPin className="w-4 h-4" />
              {recommendation.leaveMessage}
            </p>
          )}
          {userLocation && (
            <p className="text-[11px] text-white/70 mt-1.5">
              {b.liveQueue.waiting} waiting · {formatDistance(b.distanceKm)} away · rating {b.averageRating?.toFixed(1)}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => navigate(`/b/${b._id}`)}
            className="px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-xs font-semibold hover:bg-white/25 transition-colors"
          >
            View Queue
          </button>
          <button
            onClick={() => navigate(`/customer/book/${b._id}`)}
            className="px-4 py-2.5 rounded-xl bg-white text-[#6D5EF7] text-xs font-bold hover:bg-white/90 transition-colors"
          >
            Book Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ExplorePage() {
  const socket = useSocket();
  const [businesses, setBusinesses] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | locating | granted | denied | manual
  const [manualQuery, setManualQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const fetchRef = useRef(null);

  const selectedBusiness = useMemo(
    () => businesses.find((b) => b._id === selectedId) || null,
    [businesses, selectedId]
  );

  const center = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    const first = businesses.find((b) => b.location?.coordinates?.some((c) => c !== 0));
    if (first?.location?.coordinates) {
      return [first.location.coordinates[1], first.location.coordinates[0]];
    }
    return [20.5937, 78.9629];
  }, [userLocation, businesses]);

  const fetchExplore = useCallback(async () => {
    const params = {};
    if (userLocation) {
      params.lat = userLocation.lat;
      params.lng = userLocation.lng;
    }
    if (activeCategory !== 'All') params.category = activeCategory.toLowerCase();
    if (searchQuery.trim()) params.search = searchQuery.trim();
    try {
      const res = await customerAPI.getExplore(params);
      setBusinesses(res.data.businesses || []);
      setRecommendation(res.data.recommendation || null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch explore data:', err);
    } finally {
      setLoading(false);
    }
  }, [userLocation, activeCategory, searchQuery]);

  useEffect(() => {
    fetchRef.current = fetchExplore;
  }, [fetchExplore]);

  useEffect(() => {
    fetchExplore();
    const interval = setInterval(fetchExplore, 30000);
    return () => clearInterval(interval);
  }, [fetchExplore]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchRef.current?.();
    socket.on('queue-refresh', refresh);
    return () => socket.off('queue-refresh', refresh);
  }, [socket]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, []);

  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
        setManualQuery('');
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
        setUserLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        setLocationStatus('manual');
      } else {
        setLocationStatus('denied');
      }
    } catch {
      setLocationStatus('denied');
    }
  };

  const clearLocation = () => {
    setUserLocation(null);
    setLocationStatus('idle');
  };

  const handleSelect = (business) => setSelectedId(business._id);

  const category = activeCategory.toLowerCase();
  const mapBusinesses = businesses.filter((b) =>
    category === 'all' || b.category?.toLowerCase() === category
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Nearby Services</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Compare queues, wait times and distances — get the fastest option near you
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <button
              onClick={() => fetchRef.current?.()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-zinc-100 text-[11px] text-zinc-500 hover:text-[#6D5EF7] hover:border-[#6D5EF7]/30 transition-colors shadow-sm"
              title="Refresh now"
            >
              <HiOutlineArrowPath className="w-3.5 h-3.5" />
              Updated {Math.max(1, Math.round((Date.now() - lastUpdated.getTime()) / 60000))} min ago
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(15,23,42,0.06)] border border-zinc-100 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
              <HiOutlineLocationMarker className={`w-4 h-4 ${locationStatus === 'granted' || locationStatus === 'manual' ? 'text-emerald-500' : 'text-[#6D5EF7]'}`} />
              {locationStatus === 'granted' && 'Using your location'}
              {locationStatus === 'manual' && 'Using manual location'}
              {locationStatus === 'locating' && 'Locating…'}
              {locationStatus === 'denied' && 'Location unavailable'}
              {locationStatus === 'idle' && 'Location off'}
            </span>
            {locationStatus === 'granted' && (
              <button onClick={clearLocation} className="text-[11px] text-zinc-400 hover:text-red-500 transition-colors">
                Clear
              </button>
            )}
            {locationStatus === 'manual' && (
              <button onClick={locateMe} className="text-[11px] text-[#6D5EF7] hover:underline">
                Use my location
              </button>
            )}
          </div>

          {locationStatus === 'granted' || locationStatus === 'manual' ? (
            <button
              onClick={locateMe}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-[#6D5EF7] border border-[#6D5EF7]/30 hover:bg-[#6D5EF7]/5 transition-colors"
            >
              <HiOutlineLocationMarker className="w-3.5 h-3.5" />
              Relocate
            </button>
          ) : (
            <button
              onClick={locateMe}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-[#6D5EF7] border border-[#6D5EF7]/30 hover:bg-[#6D5EF7]/5 transition-colors"
            >
              <HiOutlineLocationMarker className="w-3.5 h-3.5" />
              Enable Location
            </button>
          )}
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
              <p className="text-xs text-zinc-500 mb-2">
                Permission denied. Enter an area, city or landmark to find services around it:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="e.g. Delhi, Bengaluru, MG Road…"
                  className="flex-1 px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D5EF7]/40 focus:border-[#6D5EF7]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-white text-xs font-semibold"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` }}
                >
                  Search
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <RecommendationBanner recommendation={recommendation} userLocation={userLocation} />

      <div className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(15,23,42,0.06)] border border-zinc-100 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
          <HiOutlineMapPin className="w-4 h-4 text-[#6D5EF7]" />
          <span className="text-sm font-semibold text-zinc-800">Interactive Map</span>
          {userLocation && (
            <span className="text-[11px] text-zinc-400 ml-auto">Tap a marker or card for details</span>
          )}
        </div>
        <div className="h-[420px] w-full z-0">
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
            {mapBusinesses
              .filter((b) => b.location?.coordinates?.some((c) => c !== 0))
              .map((b) => {
                const [lng, lat] = b.location.coordinates;
                const isBest = recommendation?.business?._id === b._id;
                return (
                  <Marker
                    key={b._id}
                    position={[lat, lng]}
                    icon={purpleIcon(!!isBest)}
                    eventHandlers={{ click: () => handleSelect(b) }}
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
                          {b.liveQueue.waiting} waiting · ~{b.liveQueue.estimatedWaitTime} min · now serving{' '}
                          <b>{b.liveQueue.currentToken ? `Q${String(b.liveQueue.currentToken).padStart(3, '0')}` : '—'}</b>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            <MapController center={center} selectedBusiness={selectedBusiness} userLocation={userLocation} />
          </MapContainer>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
              activeCategory === category
                ? 'text-white shadow-md'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:border-[#6D5EF7]/40 hover:text-[#6D5EF7]'
            }`}
            style={activeCategory === category ? { background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` } : undefined}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by business name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6D5EF7]/40 focus:border-[#6D5EF7] shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-[3px] border-[#6D5EF7]/20 border-t-[#6D5EF7] rounded-full animate-spin" />
        </div>
      ) : mapBusinesses.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-zinc-100 p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#6D5EF7]/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineXCircle className="w-6 h-6 text-[#6D5EF7]" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900">No Services Found</h3>
          <p className="text-xs text-zinc-500 mt-2">Try a different category, search or location</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mapBusinesses.map((business) => (
            <ServiceCard
              key={business._id}
              business={business}
              isBest={recommendation?.business?._id === business._id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {!userLocation && businesses.length > 0 && (
        <div className="bg-white rounded-[20px] border border-zinc-100 p-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <HiOutlineCheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-800">Enable location for personalized recommendations</p>
            <p className="text-xs text-zinc-500 mt-1">
              Distances and travel times will be accurate, and the smart recommendation will factor in how far each
              service is from you.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
