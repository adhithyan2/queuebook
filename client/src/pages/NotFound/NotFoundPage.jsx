import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineExclamation } from 'react-icons/hi';

export default function NotFoundPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
          <HiOutlineExclamation className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-slate-900 dark:text-slate-100 mb-3">404</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">Page not found</p>
        <Link to="/" className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all">
          Back to Dashboard
        </Link>
      </div>
    </motion.div>
  );
}
