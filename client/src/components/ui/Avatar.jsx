import { getInitials } from '../../utils/helpers';

export default function Avatar({ name, src, size = 'md', className = '' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' };

  if (src) {
    return <img src={src} alt={name} className={`rounded-xl object-cover ${sizes[size]} ${className}`} />;
  }

  return (
    <div className={`rounded-xl gradient-primary flex items-center justify-center text-white font-semibold ${sizes[size]} ${className}`}>
      {getInitials(name)}
    </div>
  );
}
