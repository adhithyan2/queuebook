import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CustomerSidebar from '../components/layout/CustomerSidebar';
import Navbar from '../components/layout/Navbar';

export default function CustomerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <CustomerSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} sidebarCollapsed={sidebarCollapsed} />
      <Navbar onMenuClick={() => setMobileOpen(true)} onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
      <div className={`${sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-[280px]'} pt-[96px] transition-[margin] duration-300 ease-in-out`}>
        <div className="max-w-[1400px] mx-auto">
          <main className="px-8 py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
