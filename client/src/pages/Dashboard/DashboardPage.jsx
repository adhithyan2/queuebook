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
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-10">
        <WelcomeBanner />
      </div>

      <div className="mb-10">
        <NextAppointment />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <QueueWidget />
        <StatsGrid />
      </div>

      <div className="mb-10">
        <ServiceCategories />
      </div>

      <div className="mb-10">
        <NearbyWidget />
      </div>

      <RecentAppointments />
    </motion.div>
  );
}
