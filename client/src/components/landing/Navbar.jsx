import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import Button from '../ui/Button';

export default function LandingNavbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <HiOutlinePlus className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">QueueBook</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How it Works</a>
            <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Testimonials</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="md" onClick={() => navigate('/login')}>Sign In</Button>
            <Button variant="gradient" size="md" onClick={() => navigate('/register')}>Get Started</Button>
          </div>

          <button onClick={() => setMobileMenu(true)} className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100">
            <HiOutlineMenu className="w-6 h-6" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenu && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileMenu(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-50 md:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100">
                <span className="font-bold gradient-text">QueueBook</span>
                <button onClick={() => setMobileMenu(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-2">
                <a href="#features" onClick={() => setMobileMenu(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Features</a>
                <a href="#how-it-works" onClick={() => setMobileMenu(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">How it Works</a>
                <a href="#testimonials" onClick={() => setMobileMenu(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Testimonials</a>
                <div className="pt-4 space-y-3">
                  <Button fullWidth variant="secondary" onClick={() => { setMobileMenu(false); navigate('/login'); }}>Sign In</Button>
                  <Button fullWidth variant="gradient" onClick={() => { setMobileMenu(false); navigate('/register'); }}>Get Started</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
