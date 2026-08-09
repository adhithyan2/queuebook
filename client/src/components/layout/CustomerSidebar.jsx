import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineViewGrid, HiOutlineCalendar, HiOutlineClipboardList,
  HiOutlineLocationMarker, HiOutlineBell, HiOutlineUser, HiOutlineCog,
  HiOutlineSupport, HiOutlineLogout, HiOutlineX, HiOutlinePlus
} from 'react-icons/hi';

const navItems = [
  { path: '/customer/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
  { path: '/customer/appointments', label: 'Appointments', icon: HiOutlineCalendar },
  { path: '/customer/queue', label: 'My Queue', icon: HiOutlineClipboardList },
  { path: '/customer/nearby', label: 'Nearby', icon: HiOutlineLocationMarker },
  { path: '/customer/notifications', label: 'Notifications', icon: HiOutlineBell },
  { path: '/customer/profile', label: 'Profile', icon: HiOutlineUser },
];

const bottomItems = [
  { path: '/support', label: 'Support', icon: HiOutlineSupport },
  { path: '/settings', label: 'Settings', icon: HiOutlineCog },
];

export default function CustomerSidebar({ mobileOpen, onMobileClose, sidebarCollapsed }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const NavLink = ({ item }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;
    return (
      <Link to={item.path} onClick={() => onMobileClose?.()}
        className={`group flex items-center gap-3 px-3 mx-3 h-10 rounded-xl text-[13px] font-medium transition-all duration-150 ${
          isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/60'
        }`}>
        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <HiOutlinePlus className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-bold gradient-text tracking-tight">QueueBook</span>
      </div>

      <nav className="flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => <NavLink key={item.path} item={item} />)}
      </nav>

      <div className="py-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-0.5">
        {bottomItems.map((item) => <NavLink key={item.path} item={item} />)}
        <button onClick={logout}
          className="flex items-center gap-3 px-3 mx-3 h-10 rounded-xl text-[13px] font-medium text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors w-full">
          <HiOutlineLogout className="w-[18px] h-[18px] flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>

      <div className="px-3 pb-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <Link to="/customer/profile" className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-zinc-400 truncate">{user?.email || ''}</p>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <aside className={`hidden lg:flex fixed left-0 top-16 w-[240px] h-[calc(100vh-4rem)] bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-800 flex-col z-30 transition-transform duration-300 ease-in-out ${
        sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
      }`}>
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden" onClick={onMobileClose} />
            <motion.aside key="sidebar" initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-[260px] bg-white dark:bg-zinc-950 z-50 lg:hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                    <HiOutlinePlus className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-base font-bold gradient-text tracking-tight">QueueBook</span>
                </div>
                <button onClick={onMobileClose} className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
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
