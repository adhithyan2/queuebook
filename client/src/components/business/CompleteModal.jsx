import { motion } from 'framer-motion';
import { HiOutlineCheck, HiOutlineXMark, HiOutlineBanknotes } from 'react-icons/hi2';

/**
 * Completion dialog for the business queue.
 * Completing only requires a simple Paid / Unpaid decision — no transaction ID.
 */
export default function CompleteModal({ open, label, amountLabel, busy, onPaid, onUnpaid, onClose }) {
  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-100 dark:border-zinc-800 shadow-xl"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Complete {label}?</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <HiOutlineXMark className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
          Was payment collected for this visit?
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onPaid}
            disabled={busy}
            className="flex items-center justify-between gap-2 h-11 px-4 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2"><HiOutlineCheck className="w-4 h-4" /> Mark Paid</span>
            {amountLabel ? <span className="text-xs opacity-80">₹{amountLabel}</span> : null}
          </button>
          <button
            onClick={onUnpaid}
            disabled={busy}
            className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiOutlineBanknotes className="w-4 h-4" /> Mark Unpaid
          </button>
          <button
            onClick={onClose}
            disabled={busy}
            className="h-10 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
