import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover, padding = 'p-6' }) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : {}}
      className={`bg-white rounded-2xl border border-slate-100 card-shadow ${padding} ${hover ? 'card-shadow-hover cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}
