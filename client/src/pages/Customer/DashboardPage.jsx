import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineCalendar, HiOutlineUsers, HiOutlineClock, HiOutlineLocationMarker, HiOutlineBell, HiOutlineStar, HiOutlineArrowRight, HiOutlineSearch } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { customerAPI } from '../../services/api';
import Badge from '../../components/ui/Badge';
import SmartArrivalWidget from '../../components/dashboard/SmartArrivalWidget';

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await customerAPI.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Here's what's happening today
          </p>
        </div>
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {dashboard?.upcomingAppointment && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Upcoming Appointment</h2>
                <Badge variant="primary">Today</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {dashboard.upcomingAppointment.business?.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {dashboard.upcomingAppointment.service} • Token {dashboard.upcomingAppointment.tokenNumber}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <HiOutlineClock className="w-3 h-3" />
                      {dashboard.upcomingAppointment.timeSlot}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <HiOutlineLocationMarker className="w-3 h-3" />
                      {dashboard.upcomingAppointment.business?.address || ''}
                    </span>
                  </div>
                </div>
                <Link
                  to="/customer/queue"
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  View Queue
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <Link
              to="/customer/book"
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 hover:border-primary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <HiOutlineCalendar className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Book</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Schedule new</p>
            </Link>
            <Link
              to="/customer/queue"
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 hover:border-primary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <HiOutlineUsers className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Queue</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Track status</p>
            </Link>
            <Link
              to="/customer/nearby"
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 hover:border-primary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <HiOutlineLocationMarker className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nearby</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Find places</p>
            </Link>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nearby Services</h2>
              <Link
                to="/customer/nearby"
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                View All <HiOutlineArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {dashboard?.nearbyBusinesses?.slice(0, 3).map((service) => (
                <div
                  key={service._id}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <HiOutlineStar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{service.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{service.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <HiOutlineStar className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{service.rating}</span>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{service.address}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <SmartArrivalWidget />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Notifications</h2>
              <Link
                to="/customer/notifications"
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {dashboard?.unreadNotifications?.slice(0, 3).map((notification) => (
                <div
                  key={notification._id}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <HiOutlineBell className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;
