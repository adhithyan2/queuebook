import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { smartArrivalAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import {
  HiOutlineClock, HiOutlineUsers, HiOutlineLocationMarker, HiOutlineArrowRight,
  HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineSparkles,
} from 'react-icons/hi';

function formatTime(iso) {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatCountdown(minutes) {
  if (minutes === null || minutes === undefined) return null;
  const m = Math.max(0, Math.floor(minutes));
  const s = Math.round((minutes - m) * 60);
  return { m, s };
}

export default function SmartArrivalWidget() {
  const socket = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [countdown, setCountdown] = useState(null);

  const fetchRecommendation = useCallback(() => {
    const params = {};
    if (userLocation) {
      params.lat = userLocation.lat;
      params.lng = userLocation.lng;
    }
    smartArrivalAPI.getRecommendation(params)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userLocation]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    fetchRecommendation();
    const interval = setInterval(fetchRecommendation, 15000);
    return () => clearInterval(interval);
  }, [fetchRecommendation]);

  useEffect(() => {
    if (!socket || !data?.active) return;
    const handleRefresh = () => fetchRecommendation();
    socket.on('queue-refresh', handleRefresh);
    return () => socket.off('queue-refresh', handleRefresh);
  }, [socket, data?.active, fetchRecommendation]);

  useEffect(() => {
    if (!data?.active || data.leaveInMinutes === null) return;
    const interval = setInterval(() => {
      setCountdown(formatCountdown(data.leaveInMinutes));
    }, 1000);
    return () => clearInterval(interval);
  }, [data?.active, data?.leaveInMinutes]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <HiOutlineSparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Smart Arrival Assistant</h3>
            <p className="text-sm text-slate-400">Analyzing queue status...</p>
          </div>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-indigo-200 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data?.active) return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl border border-slate-200 p-6 card-shadow"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-white/80 flex items-center justify-center">
          <HiOutlineSparkles className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Smart Arrival Assistant</h3>
          <p className="text-sm text-slate-400">Join a queue to get smart departure recommendations</p>
        </div>
      </div>
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 text-center">
        <HiOutlineClock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No active queue. Book an appointment to enable smart arrival.</p>
      </div>
    </motion.div>
  );

  const isGoogleMaps = data.hasGoogleMaps;
  const hasLocation = data.hasLocation;

  const statusConfig = {
    leave_now: {
      bg: 'from-rose-50 to-red-50',
      border: 'border-rose-200',
      icon: HiOutlineExclamationCircle,
      iconColor: 'text-red-500',
      badge: 'bg-red-100 text-red-700',
      badgeText: 'Leave Now!',
      progressColor: 'bg-red-500',
      message: data.message,
    },
    hurry: {
      bg: 'from-amber-50 to-orange-50',
      border: 'border-amber-200',
      icon: HiOutlineExclamationCircle,
      iconColor: 'text-amber-500',
      badge: 'bg-amber-100 text-amber-700',
      badgeText: 'Get Ready!',
      progressColor: 'bg-amber-500',
      message: data.message,
    },
    relax: {
      bg: 'from-emerald-50 to-green-50',
      border: 'border-emerald-200',
      icon: HiOutlineCheckCircle,
      iconColor: 'text-emerald-500',
      badge: 'bg-emerald-100 text-emerald-700',
      badgeText: 'Relax',
      progressColor: 'bg-emerald-500',
      message: data.message,
    },
  };

  const status = statusConfig[data.recommendation] || statusConfig.relax;
  const StatusIcon = status.icon;

  const leaveProgress = data.leaveInMinutes !== null
    ? Math.min(100, Math.max(0, ((data.estimatedWaitTime - data.leaveInMinutes) / Math.max(data.estimatedWaitTime, 1)) * 100))
    : 0;

  const navUrl = hasLocation
    ? `https://www.google.com/maps/dir/?api=1&destination=${data.businessName}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.businessName + ' ' + (data.businessAddress || ''))}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${status.bg} rounded-2xl border ${status.border} p-6 card-shadow`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/80 flex items-center justify-center">
            <HiOutlineSparkles className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Smart Arrival Assistant</h3>
            <p className="text-sm text-slate-500">{data.businessName}</p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${status.badge}`}>
          {status.badgeText}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Queue No.</p>
          <p className="text-2xl font-bold text-indigo-600">Q{String(data.queueNumber).padStart(3, '0')}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">People Ahead</p>
          <p className="text-2xl font-bold text-amber-600">{data.peopleAhead}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Wait Time</p>
          <p className="text-2xl font-bold text-slate-900">{data.estimatedWaitTime}m</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Travel Time</p>
          <p className="text-2xl font-bold text-blue-600">
            {data.travelTimeMin !== null ? `${data.travelTimeMin}m` : '—'}
          </p>
        </div>
      </div>

      {data.leaveInMinutes !== null && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600">Departure Countdown</span>
            <StatusIcon className={`w-5 h-5 ${status.iconColor}`} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={data.recommendation}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center mb-4"
            >
              {data.recommendation === 'leave_now' ? (
                <p className="text-4xl font-extrabold text-red-600 animate-pulse">GO NOW!</p>
              ) : (
                <p className="text-4xl font-extrabold text-slate-900">
                  {countdown ? `${countdown.m}:${String(countdown.s).padStart(2, '0')}` : `${data.leaveInMinutes}m`}
                </p>
              )}
              <p className="text-sm text-slate-500 mt-1">
                {data.recommendation === 'leave_now' ? 'Leave immediately' : 'until you should leave'}
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${leaveProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full ${status.progressColor} rounded-full`}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {data.estimatedLeaveTime && (
            <div className="flex items-center gap-2">
              <HiOutlineClock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Leave by <span className="font-semibold">{formatTime(data.estimatedLeaveTime)}</span></span>
            </div>
          )}
          {data.estimatedServiceTime && (
            <div className="flex items-center gap-2">
              <HiOutlineUsers className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Service ~<span className="font-semibold">{formatTime(data.estimatedServiceTime)}</span></span>
            </div>
          )}
        </div>
      </div>

      {!hasLocation && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2">
            <HiOutlineLocationMarker className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-600">Enable location for accurate travel time estimation.</p>
          </div>
        </div>
      )}

      {hasLocation && !isGoogleMaps && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2">
            <HiOutlineLocationMarker className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-500">Using estimated travel time. Add Google Maps API key for live traffic data.</p>
          </div>
        </div>
      )}

      <a
        href={navUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
      >
        <HiOutlineLocationMarker className="w-4 h-4" />
        {data.recommendation === 'leave_now' ? 'Navigate Now' : 'Open in Google Maps'}
        <HiOutlineArrowRight className="w-4 h-4" />
      </a>
    </motion.div>
  );
}
