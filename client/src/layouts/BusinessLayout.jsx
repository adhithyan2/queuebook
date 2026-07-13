import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import BusinessSidebar from '../components/layout/BusinessSidebar';
import Navbar from '../components/layout/Navbar';
import Container from '../components/ui/Container';

export default function BusinessLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <BusinessSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} sidebarCollapsed={sidebarCollapsed} />
      <Navbar onMenuClick={() => setMobileOpen(true)} onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
      <div
        className="transition-[margin] duration-300 ease-in-out"
        style={{
          paddingTop: '120px',
          marginLeft: sidebarCollapsed ? '24px' : '280px',
          marginRight: sidebarCollapsed ? '24px' : '0px',
          width: sidebarCollapsed ? 'calc(100% - 48px)' : 'calc(100% - 280px)',
        }}
      >
        <Container className="py-10">
          <main className="space-y-12">
            <Outlet />
          </main>
        </Container>
      </div>
    </div>
  );
}
