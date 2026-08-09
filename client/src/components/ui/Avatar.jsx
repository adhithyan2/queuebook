import { getInitials } from '../../utils/helpers';

export default function Avatar({ name, src, size = 'md', className = '' }) {
  const sizes = { sm: 'w-8 h-8 text-[11px]', md: 'w-9 h-9 text-xs', lg: 'w-12 h-12 text-sm', xl: 'w-16 h-16 text-lg' };

  if (src) {
    return <img src={src} alt={name} className={`rounded-full object-cover ${sizes[size]} ${className}`} />;
  }

  return (
    <div className={`rounded-full gradient-primary flex items-center justify-center text-white font-semibold ${sizes[size]} ${className}`}>
      {getInitials(name)}
    </div>
  );
}
