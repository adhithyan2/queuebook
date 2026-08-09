import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineExclamation } from 'react-icons/hi';

export default function NotFoundPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <HiOutlineExclamation className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">404</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">Page not found</p>
        <Link to="/" className="inline-block px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors">
          Back to Dashboard
        </Link>
      </div>
    </motion.div>
  );
}
