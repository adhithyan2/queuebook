import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineStar, HiOutlineMapPin, HiOutlinePhone, HiOutlineClock,
  HiOutlineUsers, HiOutlineArrowRight, HiCheckBadge, HiOutlineHashtag,
} from 'react-icons/hi2';
import { customerAPI } from '../../services/api';

export default function PublicBusinessPage() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    customerAPI.getBusinessPublic(businessId)
      .then((res) => setData(res.data))
      .catch((e) => setError(e.response?.data?.message || 'Business not found'))
      .finally(() => setLoading(false));
  }, [businessId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="w-6 h-6 border-2 border-indigo-400/20 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 max-w-sm w-full text-center">
          <HiOutlineHashtag className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Business Not Found</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{error}</p>
          <Link to="/" className="mt-5 inline-flex px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
            Go to QueueBook
          </Link>
        </div>
      </div>
    );
  }

  const { business, liveQueue, recentReviews } = data;
  const averageRating = recentReviews?.length
    ? (recentReviews.reduce((s, r) => s + r.rating, 0) / recentReviews.length).toFixed(1)
    : business.rating;

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white text-lg font-extrabold flex-shrink-0">
              {business.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white flex items-center gap-1.5">
                {business.name}
                <HiCheckBadge className="w-5 h-5 text-indigo-200" />
              </h1>
              <p className="text-sm text-indigo-100 capitalize">{business.category}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium">
              <HiOutlineStar className="w-3.5 h-3.5 text-amber-300" /> {Number(averageRating) || '—'}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium">
              <HiOutlineMapPin className="w-3.5 h-3.5" /> {business.address || 'No address'}
            </span>
            {business.phone && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium">
                <HiOutlinePhone className="w-3.5 h-3.5" /> {business.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
          <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Live Queue</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 p-3 text-center">
              <HiOutlineUsers className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{liveQueue.waiting}</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Waiting</p>
            </div>
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 p-3 text-center">
              <HiOutlineHashtag className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{liveQueue.currentToken != null ? `Q${liveQueue.currentToken}` : '—'}</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Now Serving</p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-3 text-center">
              <HiOutlineClock className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{liveQueue.estimatedWait}m</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Est. Wait</p>
            </div>
          </div>
        </div>

        {business.description && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
            <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">About</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{business.description}</p>
          </div>
        )}

        {business.services?.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
            <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Services</h2>
            <div className="space-y-2">
              {business.services.map((s) => (
                <div key={s.name} className="flex items-center justify-between py-2 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{s.name}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{s.duration} min{s.price ? ` · $${s.price}` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentReviews?.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
            <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Reviews</h2>
            <div className="space-y-3">
              {recentReviews.map((r) => (
                <div key={r._id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {r.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{r.user?.name || 'Anonymous'}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <HiOutlineStar key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200 dark:text-zinc-700'}`} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{r.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => navigate(`/login?redirect=/customer/book/${businessId}`)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Book an Appointment <HiOutlineArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
