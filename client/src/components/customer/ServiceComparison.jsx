import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineSparkles, HiOutlineStar, HiOutlineMapPin,
  HiOutlineCalendar, HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { HiOutlineSearch } from 'react-icons/hi';
import { customerAPI } from '../../services/api';
import VerifiedBadge from '../ui/VerifiedBadge';
import { useSocket } from '../../context/SocketContext';

const ACCENT = '#6D5EF7';

const POPULAR_SERVICES = ['Haircut', 'Hair Coloring', 'Facial', 'Shave', 'Cleaning', 'Consultation'];

function formatDistance(km) {
  if (km === null || km === undefined) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${Number(km).toFixed(1)} km`;
}

function formatPrice(price) {
  if (price === null || price === undefined) return '—';
  return `₹${price}`;
}

function formatTime(hhmm) {
  if (!hhmm) return '—';
  const [h, m] = String(hhmm).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function Rating({ value, count }) {
  const rating = Number(value) || 0;
  return (
    <span className="inline-flex items-center gap-1">
      <HiOutlineStar className={`w-4 h-4 ${rating > 0 ? 'text-amber-400 fill-amber-400' : 'text-zinc-200'}`} />
      <span className="text-sm font-semibold text-zinc-800">{rating > 0 ? rating.toFixed(1) : '—'}</span>
      {count > 0 && <span className="text-xs text-zinc-400">({count})</span>}
    </span>
  );
}

function Metric({ label, value, sub, accent }) {
  return (
    <div className={`rounded-2xl p-3 text-center ${accent ? 'bg-[#6D5EF7]/10' : 'bg-[#6D5EF7]/[0.06]'}`}>
      <p className="text-[10px] text-zinc-400 mb-1">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-[#6D5EF7]' : 'text-zinc-900'}`}>{value}</p>
      {sub && <p className="text-[10px] text-zinc-400">{sub}</p>}
    </div>
  );
}

function ServiceCompareCard({ result, recommended, selected, onToggle, onView, onBook }) {
  const isOpen = result.isOpen;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(15,23,42,0.06)] border transition-all duration-200 ${
        recommended
          ? 'border-[#6D5EF7]/60 ring-1 ring-[#6D5EF7]/40'
          : selected
            ? 'border-[#6D5EF7]/50'
            : 'border-zinc-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-zinc-900 flex items-center gap-1.5 flex-wrap">
            {result.name}
            <VerifiedBadge className="text-[#6D5EF7]" />
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5 capitalize">
            {result.serviceName} · {result.category}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
            {isOpen ? 'Open' : 'Closed'}
          </span>
          <button
            onClick={() => onToggle(result.businessId)}
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
              selected
                ? 'bg-[#6D5EF7] text-white'
                : 'bg-[#6D5EF7]/10 text-[#6D5EF7] hover:bg-[#6D5EF7]/20'
            }`}
          >
            {selected ? 'Added' : 'Compare'}
          </button>
        </div>
      </div>

      {recommended && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#6D5EF7]/10 text-[#6D5EF7] text-[11px] font-semibold mb-3">
          <HiOutlineSparkles className="w-3.5 h-3.5" />
          Recommended for you
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] text-zinc-400">Price</p>
          <p className="text-xl font-extrabold text-zinc-900">{formatPrice(result.price)}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <HiOutlineMapPin className="w-4 h-4 text-[#6D5EF7]" />
          <span className="font-medium text-zinc-700">{formatDistance(result.distanceKm)}</span>
          {result.travelTimeMin !== null && (
            <span className="text-zinc-400">· {result.travelTimeMin} min</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <Metric label="Queue" value={result.queueSize ?? 0} sub="waiting" />
        <Metric label="Est. Wait" value={result.estimatedWaitTime ?? '—'} sub="min" accent />
        <Metric label="Rating" value={<Rating value={result.rating} count={result.reviewCount} />} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <HiOutlineCalendar className="w-4 h-4 text-[#6D5EF7]" />
          <span>
            {result.nextAvailableSlot
              ? <>Next available <span className="text-emerald-600 font-semibold">{formatTime(result.nextAvailableSlot)}</span></>
              : result.availableSlots > 0
                ? <span className="text-emerald-600 font-medium">{result.availableSlots} slots today</span>
                : <span className="text-amber-500 font-medium">Fully booked today</span>}
          </span>
        </div>
        {result.openTime && (
          <span className="text-[11px] text-zinc-400">{result.openTime}–{result.closeTime}</span>
        )}
      </div>

      {result.reasons?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {result.reasons.map((r, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
              <HiOutlineCheckCircle className="w-3 h-3" />
              {r}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onView(result.businessId)}
          className="flex-1 py-2.5 rounded-xl border border-[#6D5EF7]/30 text-[#6D5EF7] text-xs font-semibold hover:bg-[#6D5EF7]/5 transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => onBook(result.businessId)}
          className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` }}
        >
          Book Now
        </button>
      </div>
    </motion.div>
  );
}

function CompareTable({ results, recommendedId, selectedIds, onToggle, onView, onBook }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full min-w-[680px] text-left">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
            <th className="pb-3 pr-2 font-semibold">Business</th>
            <th className="pb-3 pr-4 font-semibold">Price</th>
            <th className="pb-3 pr-4 font-semibold">Queue</th>
            <th className="pb-3 pr-4 font-semibold">Wait</th>
            <th className="pb-3 pr-4 font-semibold">Distance</th>
            <th className="pb-3 pr-4 font-semibold">Rating</th>
            <th className="pb-3 pr-4 font-semibold">Next slot</th>
            <th className="pb-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const isRecommended = String(r.businessId) === String(recommendedId);
            const selected = selectedIds.includes(String(r.businessId));
            return (
              <tr
                key={String(r.businessId)}
                className={`border-b border-zinc-50 last:border-0 ${isRecommended ? 'bg-[#6D5EF7]/[0.04]' : ''}`}
              >
                <td className="py-3.5 pr-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggle(r.businessId)}
                      className="w-3.5 h-3.5 rounded border-zinc-300 text-[#6D5EF7] focus:ring-[#6D5EF7]/30 accent-[#6D5EF7]"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-900 truncate max-w-[180px] flex items-center gap-1">
                        {r.name}
                        {isRecommended && <HiOutlineSparkles className="w-3.5 h-3.5 text-[#6D5EF7] flex-shrink-0" />}
                      </p>
                      <p className="text-[11px] text-zinc-400">{r.serviceName}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 pr-4 text-sm font-bold text-zinc-900">{formatPrice(r.price)}</td>
                <td className="py-3.5 pr-4 text-sm text-zinc-700">{r.queueSize ?? 0} <span className="text-xs text-zinc-400">waiting</span></td>
                <td className="py-3.5 pr-4 text-sm text-zinc-700">{r.estimatedWaitTime ?? '—'} min</td>
                <td className="py-3.5 pr-4 text-sm text-zinc-700">{formatDistance(r.distanceKm)}</td>
                <td className="py-3.5 pr-4">
                  <Rating value={r.rating} count={r.reviewCount} />
                </td>
                <td className="py-3.5 pr-4 text-sm">
                  {r.nextAvailableSlot ? (
                    <span className="text-emerald-600 font-semibold">{formatTime(r.nextAvailableSlot)}</span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="py-3.5">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onView(r.businessId)}
                      className="px-3 py-1.5 rounded-lg border border-[#6D5EF7]/30 text-[#6D5EF7] text-[11px] font-semibold hover:bg-[#6D5EF7]/5 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onBook(r.businessId)}
                      className="px-3 py-1.5 rounded-lg text-white text-[11px] font-semibold hover:opacity-90 transition-all"
                      style={{ background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` }}
                    >
                      Book
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SelectedStrip({ results, selectedIds }) {
  const selected = results.filter((r) => selectedIds.includes(String(r.businessId)));
  if (selected.length < 2) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#6D5EF7]/20 bg-[#6D5EF7]/[0.04] p-4"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6D5EF7] mb-3">
        Compare shortlist ({selected.length})
      </p>
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {selected.map((r) => (
            <div key={String(r.businessId)} className="w-44 flex-shrink-0 bg-white rounded-xl border border-zinc-100 p-3">
              <p className="text-xs font-bold text-zinc-900 truncate">{r.name}</p>
              <div className="mt-2 space-y-1 text-[11px] text-zinc-500">
                <p>Price: <span className="font-semibold text-zinc-800">{formatPrice(r.price)}</span></p>
                <p>Queue: <span className="font-semibold text-zinc-800">{r.queueSize ?? 0} waiting</span></p>
                <p>Wait: <span className="font-semibold text-zinc-800">{r.estimatedWaitTime ?? '—'} min</span></p>
                <p>Distance: <span className="font-semibold text-zinc-800">{formatDistance(r.distanceKm)}</span></p>
                <p>Rating: <span className="font-semibold text-zinc-800">{r.rating > 0 ? r.rating.toFixed(1) : '—'}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function ServiceComparison({ userLocation, presetService = '' }) {
  const socket = useSocket();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [activeService, setActiveService] = useState('');
  const [results, setResults] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showTable, setShowTable] = useState(true);
  const fetchRef = useRef(null);

  const fetchCompare = useCallback(async (service) => {
    if (!service) return;
    setLoading(true);
    setError('');
    const params = { service };
    if (userLocation?.lat && userLocation?.lng) {
      params.lat = userLocation.lat;
      params.lng = userLocation.lng;
    }
    try {
      const res = await customerAPI.compareServices(params);
      const data = res.data.results || [];
      setResults(data);
      setRecommendation(res.data.recommendation || null);
      setSelectedIds((prev) => prev.filter((id) => data.some((r) => String(r.businessId) === id)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to compare services. Please try again.');
      setResults([]);
      setRecommendation(null);
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchRef.current = fetchCompare;
  }, [fetchCompare]);

  useEffect(() => {
    const value = (presetService || '').trim();
    if (!value) return;
    setQuery(value);
    setActiveService(value);
    fetchCompare(value);
    containerRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [presetService, fetchCompare]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      if (activeService) fetchRef.current?.(activeService);
    };
    socket.on('queue-refresh', refresh);
    return () => socket.off('queue-refresh', refresh);
  }, [socket, activeService]);

  const handleSearch = (e) => {
    e.preventDefault();
    const value = query.trim();
    if (!value) return;
    setActiveService(value);
    fetchCompare(value);
  };

  const pickChip = (svc) => {
    setQuery(svc);
    setActiveService(svc);
    fetchCompare(svc);
  };

  const toggleCompare = (businessId) => {
    const id = String(businessId);
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const recommendedId = recommendation?.top ? String(recommendation.top.businessId) : null;
  const hasResults = results.length > 0;
  const top = recommendation?.top;

  return (
    <div ref={containerRef} className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(15,23,42,0.06)] border border-zinc-100 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            Compare Services
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#6D5EF7]/10 text-[#6D5EF7] text-[10px] font-semibold">
              <HiOutlineSparkles className="w-3 h-3" /> Smart recommendation
            </span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Pick a service and compare nearby businesses by price, queue, wait time, distance and rating.
          </p>
        </div>
        {hasResults && (
          <button
            onClick={() => setShowTable((s) => !s)}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-[11px] font-semibold text-[#6D5EF7] border border-[#6D5EF7]/30 hover:bg-[#6D5EF7]/5 transition-colors"
          >
            {showTable ? 'Hide comparison' : 'Show comparison'}
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a service — e.g. Haircut, Facial, Shave…"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D5EF7]/40 focus:border-[#6D5EF7]"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-white text-xs font-semibold hover:opacity-90 transition-all flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` }}
        >
          Compare
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide mb-4">
        {POPULAR_SERVICES.map((svc) => (
          <button
            key={svc}
            onClick={() => pickChip(svc)}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded-full whitespace-nowrap transition-all ${
              activeService === svc
                ? 'text-white shadow-md'
                : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:border-[#6D5EF7]/40 hover:text-[#6D5EF7]'
            }`}
            style={activeService === svc ? { background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` } : undefined}
          >
            {svc}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-[3px] border-[#6D5EF7]/20 border-t-[#6D5EF7] rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-medium p-3.5 rounded-xl">
          {error}
        </div>
      )}

      {!loading && !error && !hasResults && activeService && (
        <div className="bg-zinc-50 rounded-2xl p-8 text-center">
          <div className="w-11 h-11 rounded-2xl bg-[#6D5EF7]/10 flex items-center justify-center mx-auto mb-3">
            <HiOutlineMapPin className="w-5 h-5 text-[#6D5EF7]" />
          </div>
          <p className="text-sm font-semibold text-zinc-900">No businesses found for “{activeService}”</p>
          <p className="text-xs text-zinc-500 mt-1">Try another service name or check back later.</p>
        </div>
      )}

      {!loading && hasResults && (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={recommendation?.hasEnoughData ? 'rec' : 'no-rec'}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              {recommendation?.hasEnoughData && top ? (
                <div
                  className="rounded-2xl p-4 text-white relative overflow-hidden"
                  style={{ background: `linear-gradient(120deg, ${ACCENT}, #8B5CF6 60%, #7C3AED)` }}
                >
                  <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
                      <HiOutlineSparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold">Top pick for you</p>
                      <p className="text-xs text-white/80">Best choice for “{activeService}”</p>
                    </div>
                  </div>
                  <p className="text-lg font-extrabold">{top.name}</p>
                  <p className="text-sm text-white/85 mt-0.5">
                    {formatPrice(top.price)} · {top.queueSize ?? 0} waiting · ~{top.estimatedWaitTime ?? '—'} min ·{' '}
                    {formatDistance(top.distanceKm)} away
                  </p>
                  {top.reasons?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {top.reasons.map((r, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/15 text-[10px] font-semibold">
                          <HiOutlineCheckCircle className="w-3 h-3" />
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => navigate(`/b/${top.businessId}`)}
                      className="px-3.5 py-2 rounded-lg bg-white/15 backdrop-blur border border-white/20 text-xs font-semibold hover:bg-white/25 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => navigate(`/customer/book/${top.businessId}`)}
                      className="px-3.5 py-2 rounded-lg bg-white text-[#6D5EF7] text-xs font-bold hover:bg-white/90 transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3 flex items-center gap-2.5">
                  <HiOutlineCheckCircle className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <p className="text-xs text-zinc-500">
                    Found <span className="font-semibold text-zinc-700">{results.length} business{results.length > 1 ? 'es' : ''}</span> offering “{activeService}”.
                    {results.length >= 2
                      ? ' Not enough comparison data (price, queue, wait) available yet to recommend one.'
                      : ' Add more businesses offering this service to enable smart recommendations.'}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
              {results.length} result{results.length > 1 ? 's' : ''} · {activeService}
            </p>
            {userLocation && (
              <p className="text-[11px] text-zinc-400">
                sorted by smart score
              </p>
            )}
          </div>

          <SelectedStrip results={results} selectedIds={selectedIds} />

          <AnimatePresence>
            {showTable && results.length > 1 && (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hidden md:block bg-white border border-zinc-100 rounded-2xl p-4 mb-4"
              >
                <CompareTable
                  results={results}
                  recommendedId={recommendedId}
                  selectedIds={selectedIds}
                  onToggle={toggleCompare}
                  onView={(id) => navigate(`/b/${id}`)}
                  onBook={(id) => navigate(`/customer/book/${id}`)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${showTable && results.length > 1 ? 'md:hidden' : ''}`}>
            {results.map((r) => (
              <ServiceCompareCard
                key={String(r.businessId)}
                result={r}
                recommended={String(r.businessId) === recommendedId}
                selected={selectedIds.includes(String(r.businessId))}
                onToggle={toggleCompare}
                onView={(id) => navigate(`/b/${id}`)}
                onBook={(id) => navigate(`/customer/book/${id}`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
