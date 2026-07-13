import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { businessAPI, customerAPI } from '../../services/api';
import { HiOutlineStar, HiOutlineCalendar } from 'react-icons/hi';

export default function BusinessReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    businessAPI.getDashboard()
      .then(res => {
        if (res.data.business?._id) {
          customerAPI.getReviews(res.data.business._id)
            .then(r => setReviews(r.data.reviews))
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Customer Reviews</h1>
        <p className="text-slate-500 mt-2">
          {reviews.length > 0 ? `${reviews.length} reviews · ${avgRating} avg rating` : 'See what customers say about your business.'}
        </p>
      </div>

      <div className="space-y-4">
        {reviews.length > 0 ? reviews.map((r, i) => (
          <motion.div
            key={r._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white rounded-2xl border border-slate-100 p-5 card-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-sm font-bold">
                  {r.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{r.user?.name || 'Anonymous'}</p>
                  <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <HiOutlineStar key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
            {r.comment && (
              <p className="text-sm text-slate-600">{r.comment}</p>
            )}
          </motion.div>
        )) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <HiOutlineStar className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">No reviews yet</p>
            <p className="text-xs text-slate-400 mt-1">Reviews will appear here once customers leave feedback.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
