import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../ui/Avatar';
import { HiOutlineSearch, HiOutlineBell, HiOutlineUser, HiOutlineCog, HiOutlineLogout, HiOutlineMenu, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';

export default function Navbar({ onMenuClick, onToggleSidebar, sidebarCollapsed }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
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
    <header className="fixed top-0 left-0 right-0 h-[72px] z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100/80 dark:border-slate-700/80">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                onMenuClick?.();
              } else {
                onToggleSidebar?.();
              }
            }}
            className="p-2.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 flex-shrink-0"
            aria-label="Toggle menu"
          >
            <HiOutlineMenu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
            <HiOutlineSearch className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {isDark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
          </button>

          <Link to={`${user?.role === 'business' ? '/business' : '/customer'}/notifications`} className="relative p-2.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
            <HiOutlineBell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            >
              <Avatar name={user?.name} size="sm" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">{user?.name?.split(' ')[0]}</span>
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-14 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50"
                >
                  <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{user?.email}</p>
                  </div>
                  <Link to="/customer/profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <HiOutlineUser className="w-4 h-4" /> Profile
                  </Link>
                  <Link to="/settings" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <HiOutlineCog className="w-4 h-4" /> Settings
                  </Link>
                  <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                    <button onClick={() => { setShowDropdown(false); logout(); }} className="flex items-center gap-3 px-5 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full transition-colors">
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
