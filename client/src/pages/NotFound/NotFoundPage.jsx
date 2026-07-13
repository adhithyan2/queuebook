import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import { HiOutlineArrowLeft } from 'react-icons/hi';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/dashboard">
          <Button variant="gradient" size="lg" icon={<HiOutlineArrowLeft className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
