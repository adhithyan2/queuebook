import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import { HiOutlineSearch, HiOutlineBell, HiOutlineUser, HiOutlineCog, HiOutlineLogout, HiOutlineMenu } from 'react-icons/hi';

export default function Navbar({ onMenuClick, onToggleSidebar, sidebarCollapsed }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-[80px] z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="flex items-center justify-between h-full px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                onMenuClick?.();
              } else {
                onToggleSidebar?.();
              }
            }}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all flex-shrink-0"
            aria-label="Toggle menu"
          >
            <HiOutlineMenu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-3 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <HiOutlineSearch className="w-5 h-5" />
          </button>
          <button className="relative p-3 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <HiOutlineBell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-all"
            >
              <Avatar name={user?.name} size="sm" />
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-lg border border-slate-100 py-2 z-50"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                    <HiOutlineUser className="w-4 h-4" /> Profile
                  </Link>
                  <Link to="/settings" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                    <HiOutlineCog className="w-4 h-4" /> Settings
                  </Link>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button onClick={() => { setShowDropdown(false); logout(); }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full">
                      <HiOutlineLogout className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
