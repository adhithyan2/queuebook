import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover, padding = 'p-8', shadow = 'card-shadow' }) {
  return (
    <motion.div
      whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : {}}
      className={`bg-white dark:bg-slate-800 rounded-[20px] border border-slate-100 dark:border-slate-700 ${shadow} ${padding} ${hover ? 'card-shadow-hover cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}
