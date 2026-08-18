import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CustomerSidebar from '../components/layout/CustomerSidebar';
import Navbar from '../components/layout/Navbar';
import Container from '../components/ui/Container';
import VoiceAssistant from '../components/voice/VoiceAssistant';

export default function CustomerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b]">
      <CustomerSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} sidebarCollapsed={sidebarCollapsed} />
      <Navbar onMenuClick={() => setMobileOpen(true)} onToggleSidebar={toggleSidebar} />
      <div className="transition-[margin] duration-300 ease-in-out"
        style={{
          paddingTop: '80px',
          marginLeft: sidebarCollapsed ? '0px' : '240px',
          width: sidebarCollapsed ? '100%' : 'calc(100% - 240px)',
        }}>
        <Container className="py-8">
          <main className="space-y-8">
            <Outlet />
          </main>
        </Container>
      </div>
      <VoiceAssistant />
    </div>
  );
}
