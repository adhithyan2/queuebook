import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineViewGrid, HiOutlineClipboardList, HiOutlineChartBar,
  HiOutlineStar, HiOutlineUser, HiOutlineCog,
  HiOutlineSupport, HiOutlineLogout, HiOutlineX, HiOutlinePlus
} from 'react-icons/hi';

const navItems = [
  { path: '/business/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
  { path: '/business/queue', label: 'Queue', icon: HiOutlineClipboardList },
  { path: '/business/analytics', label: 'Analytics', icon: HiOutlineChartBar },
  { path: '/business/reviews', label: 'Reviews', icon: HiOutlineStar },
  { path: '/business/profile', label: 'Profile', icon: HiOutlineUser },
];

const bottomItems = [
  { path: '/support', label: 'Support', icon: HiOutlineSupport },
  { path: '/settings', label: 'Settings', icon: HiOutlineCog },
];

export default function BusinessSidebar({ mobileOpen, onMobileClose, sidebarCollapsed }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const NavLink = ({ item }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        onClick={() => onMobileClose?.()}
        className={`group flex items-center gap-3 pl-5 pr-4 h-13 rounded-2xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-indigo-50 text-indigo-600 shadow-sm'
            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Icon className="w-[22px] h-[22px] flex-shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 pt-8 pb-8 px-6 flex-shrink-0 border-b border-[#ECECEC]">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <HiOutlinePlus className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold gradient-text">QueueBook</span>
      </div>

      <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </nav>

      <div className="py-5 border-t border-[#ECECEC] space-y-1">
        {bottomItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
        <button
          onClick={logout}
          className="flex items-center gap-3 pl-5 pr-4 h-13 rounded-2xl text-sm font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 w-full"
        >
          <HiOutlineLogout className="w-[22px] h-[22px] flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>

      <div className="px-3 pb-5 pt-5 border-t border-[#ECECEC]">
        <Link to="/customer/profile" className="flex items-center gap-3 pl-3 pr-3 py-4 rounded-[14px] hover:bg-slate-50 transition-all">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <aside className={`hidden lg:flex fixed left-0 top-[72px] w-[280px] h-[calc(100vh-72px)] bg-white border-r border-[#ECECEC] flex-col z-30 transition-transform duration-300 ease-in-out ${
        sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
      }`}>
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-[280px] bg-white z-50 lg:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-6 border-b border-[#ECECEC]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <HiOutlinePlus className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold gradient-text">QueueBook</span>
                </div>
                <button onClick={onMobileClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
