import { HiCheckBadge } from 'react-icons/hi2';

export default function VerifiedBadge({ className = '', showLabel = false }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-primary flex-shrink-0 ${className}`} title="Approved & verified by QueueBook">
      <HiCheckBadge className="w-4 h-4" />
      {showLabel && <span className="text-[11px] font-semibold">Verified</span>}
    </span>
  );
}
