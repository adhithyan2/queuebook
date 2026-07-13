import { motion } from 'framer-motion';
import WelcomeBanner from '../../components/dashboard/WelcomeBanner';
import NextAppointment from '../../components/dashboard/NextAppointment';
import QueueWidget from '../../components/dashboard/QueueWidget';
import StatsGrid from '../../components/dashboard/StatsGrid';
import ServiceCategories from '../../components/dashboard/ServiceCategories';
import NearbyWidget from '../../components/dashboard/NearbyWidget';
import RecentAppointments from '../../components/dashboard/RecentAppointments';

export default function DashboardPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="mb-8">
        <WelcomeBanner />
      </div>

      <div className="mb-8">
        <NextAppointment />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <QueueWidget />
        <StatsGrid />
      </div>

      <div className="mb-8">
        <ServiceCategories />
      </div>

      <div className="mb-8">
        <NearbyWidget />
      </div>

      <RecentAppointments />
    </motion.div>
  );
}
