import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { businessAPI, customerAPI } from '../../services/api';
import { HiOutlineStar } from 'react-icons/hi2';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    businessAPI.getDashboard()
      .then(async (res) => {
        const biz = res.data.business;
        setBusiness(biz);
        if (biz?._id) {
          const r = await customerAPI.getReviews(biz._id);
          setReviews(r.data.reviews || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.rating === Number(filter));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Reviews</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 flex flex-col items-center justify-center">
          <p className="text-5xl font-extrabold text-zinc-900 dark:text-zinc-100">{avgRating.toFixed(1)}</p>
          <div className="flex gap-1 mt-2 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <HiOutlineStar key={i} className={`w-5 h-5 ${i < Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-200 dark:text-zinc-700'}`} />
            ))}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{reviews.length} reviews</p>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">Rating Distribution</h2>
          <div className="space-y-2.5">
            {distribution.map(d => (
              <div key={d.star} className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 w-8">{d.star}★</span>
                <div className="flex-1 h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${d.pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-amber-400" />
                </div>
                <span className="text-[11px] font-semibold text-zinc-400 w-8 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">All Reviews</h2>
          <div className="flex gap-1.5">
            {['all', '5', '4', '3', '2', '1'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  filter === f ? 'bg-primary text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}>
                {f === 'all' ? 'All' : `${f}★`}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="space-y-1">
            {filtered.map((r, i) => (
              <motion.div key={r._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3.5 p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                  {r.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{r.user?.name || 'Anonymous'}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <HiOutlineStar key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200 dark:text-zinc-700'}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">{r.comment}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <HiOutlineStar className="w-8 h-8 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No reviews match this filter</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
