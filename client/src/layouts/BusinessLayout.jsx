import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import BusinessSidebar from '../components/layout/BusinessSidebar';
import Navbar from '../components/layout/Navbar';

export default function BusinessLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <BusinessSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} sidebarCollapsed={sidebarCollapsed} />
      <Navbar onMenuClick={() => setMobileOpen(true)} onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
      <div className={`${sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-[280px]'} pt-[80px] transition-[margin] duration-300 ease-in-out`}>
        <div className="max-w-[1400px] mx-auto">
          <main className="px-8 py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
