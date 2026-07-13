import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} sidebarCollapsed={sidebarCollapsed} />
      <Navbar onMenuClick={() => setMobileOpen(true)} onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
      <div className={`${sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-[280px]'} pt-[72px] transition-[margin] duration-300 ease-in-out`}>
        <div className="max-w-[1600px] mx-auto">
          <main className="px-8 py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
