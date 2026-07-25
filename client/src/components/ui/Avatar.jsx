import { getInitials } from '../../utils/helpers';

export default function Avatar({ name, src, size = 'md', className = '' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl' };

  if (src) {
    return <img src={src} alt={name} className={`rounded-full object-cover ${sizes[size]} ${className}`} />;
  }

  return (
    <div className={`rounded-full gradient-primary flex items-center justify-center text-white font-semibold ${sizes[size]} ${className}`}>
      {getInitials(name)}
    </div>
  );
}
