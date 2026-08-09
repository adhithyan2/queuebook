import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover, padding = 'p-6', shadow = 'card-shadow' }) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : {}}
      className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 ${shadow} ${padding} ${hover ? 'card-shadow-hover cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}
