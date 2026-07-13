const colors = {
  confirmed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  completed: 'bg-blue-50 text-blue-600 border-blue-200',
  waiting: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  called: 'bg-amber-50 text-amber-600 border-amber-200',
  active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  inactive: 'bg-slate-50 text-slate-500 border-slate-200',
  called: 'bg-amber-50 text-amber-600 border-amber-200',
  skipped: 'bg-slate-50 text-slate-500 border-slate-200',
  default: 'bg-slate-50 text-slate-600 border-slate-200',
};

export default function Badge({ children, variant = 'default', size = 'sm' }) {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-lg border ${colors[variant] || colors.default} ${sizeClasses}`}>
      {variant === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
      {children}
    </span>
  );
}
