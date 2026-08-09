import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../ui/Avatar';
import { HiOutlineSearch, HiOutlineBell, HiOutlineUser, HiOutlineCog, HiOutlineLogout, HiOutlineMenu, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';

export default function Navbar({ onMenuClick, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-40 glass">
      <div className="flex items-center justify-between h-full px-5">
        <button
          onClick={() => window.innerWidth < 1024 ? onMenuClick?.() : onToggleSidebar?.()}
          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <HiOutlineMenu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1">
          <button className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <HiOutlineSearch className="w-5 h-5" />
          </button>

          <button onClick={toggleTheme}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            {isDark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
          </button>

          <Link to={`${user?.role === 'business' ? '/business' : '/customer'}/notifications`}
            className="relative p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <HiOutlineBell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
          </Link>

          <div className="relative ml-1" ref={dropdownRef}>
            <button onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Avatar name={user?.name} size="sm" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden sm:block">{user?.name?.split(' ')[0]}</span>
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-12 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 py-1.5 z-50"
                >
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user?.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{user?.email}</p>
                  </div>
                  <Link to="/customer/profile" onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <HiOutlineUser className="w-4 h-4" /> Profile
                  </Link>
                  <Link to="/settings" onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <HiOutlineCog className="w-4 h-4" /> Settings
                  </Link>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1">
                    <button onClick={() => { setShowDropdown(false); logout(); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full transition-colors">
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
