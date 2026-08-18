const colors = {
  confirmed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  cancelled: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  completed: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
  in_progress: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  no_show: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  waiting: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  called: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
  scheduled: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  checked_in: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  inactive: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
  skipped: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
  default: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
};

export default function Badge({ children, variant = 'default', size = 'sm' }) {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full ${colors[variant] || colors.default} ${sizeClasses}`}>
      {variant === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {children}
    </span>
  );
}
