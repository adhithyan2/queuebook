import { motion } from 'framer-motion';
import { HiOutlineChartBar, HiOutlineClock } from 'react-icons/hi2';

export const CROWD_LEVEL_STYLES = {
  low: {
    label: 'Low',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    bar: '#10B981',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-amber-400',
    pill: 'bg-amber-50 text-amber-600 border-amber-100',
    bar: '#F59E0B',
  },
  high: {
    label: 'High',
    dot: 'bg-orange-500',
    pill: 'bg-orange-50 text-orange-600 border-orange-100',
    bar: '#F97316',
  },
  very_high: {
    label: 'Very High',
    dot: 'bg-red-500',
    pill: 'bg-red-50 text-red-600 border-red-100',
    bar: '#EF4444',
  },
};

export function crowdLevelColor(level) {
  return CROWD_LEVEL_STYLES[level]?.bar || '#a1a1aa';
}

export function CrowdLevelBadge({ level, label }) {
  if (!level) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
        {label || 'Not enough data'}
      </span>
    );
  }
  const style = CROWD_LEVEL_STYLES[level] || CROWD_LEVEL_STYLES.low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${style.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label || style.label}
    </span>
  );
}

export function HourlyCrowdBars({ hourly, height = 'h-40', compact = false }) {
  if (!hourly || !hourly.length) return null;
  const maxRelative = Math.max(...hourly.map((h) => h.relative || 0), 0.01);

  return (
    <div>
      <div className={`flex items-end gap-[3px] ${height} w-full`}>
        {hourly.map((h) => {
          const pct = Math.max(4, ((h.relative || 0) / maxRelative) * 100);
          return (
            <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ delay: h.hour * 0.01, duration: 0.4, ease: 'easeOut' }}
                className="w-full rounded-t-md transition-opacity hover:opacity-80"
                style={{ background: crowdLevelColor(h.level), minHeight: 3 }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-[3px] mt-1.5">
        {hourly.map((h) => (
          <div key={h.hour} className="flex-1 text-center">
            <span className={`${compact ? 'text-[7px]' : 'text-[9px]'} font-semibold text-zinc-400 dark:text-zinc-500`}>
              {h.hour % 12 === 0 ? 12 : h.hour % 12}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CrowdLegend() {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {Object.entries(CROWD_LEVEL_STYLES).map(([key, s]) => (
        <span key={key} className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="w-2 h-2 rounded-full" style={{ background: s.bar }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}

export function SourceNote({ source }) {
  if (!source) return null;
  const text = source === 'real'
    ? 'Based on recent queue & booking history'
    : source === 'insufficient'
      ? 'Not enough data yet'
      : 'Estimates';
  return (
    <p className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
      <HiOutlineChartBar className="w-3.5 h-3.5" />
      {text}
      <HiOutlineClock className="w-3 h-3 ml-1" />
      estimates only
    </p>
  );
}
