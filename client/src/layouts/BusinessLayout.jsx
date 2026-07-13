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
      <div style={{ marginLeft: '280px', paddingTop: '96px', paddingLeft: '32px', paddingRight: '32px', paddingBottom: '32px' }} className="hidden lg:block">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <main>
            <Outlet />
          </main>
        </div>
      </div>
      <div style={{ paddingTop: '96px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '32px' }} className="lg:hidden">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
