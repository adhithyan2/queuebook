import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import SmartArrivalWidget from '../../components/dashboard/SmartArrivalWidget';
import {
  HiOutlineCalendar, HiOutlineUsers, HiOutlineClock, HiOutlineLocationMarker,
  HiOutlineBell, HiOutlineStar, HiOutlineArrowRight, HiOutlineSearch
} from 'react-icons/hi';

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const { upcomingAppointment, activeQueue, queueStatus, recentAppointments, unreadNotifications, unreadCount, nearbyBusinesses } = data || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="space-y-10">
        {/* Welcome + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {user?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Here's what's happening with your queues today.</p>
          </div>
          <div className="relative w-full sm:w-auto">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search services..."
              className="w-full sm:w-72 h-12 pl-11 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Top Section: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Upcoming Appointment + Quick Actions */}
          <div className="space-y-6">
            {upcomingAppointment && (
              <Link to="/customer/appointments" className="block bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 card-shadow-lg card-shadow-hover transition-all">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Next Appointment</h2>
                  <Badge variant={upcomingAppointment.status === 'confirmed' ? 'confirmed' : 'pending'}>{upcomingAppointment.status}</Badge>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <HiOutlineCalendar className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{upcomingAppointment.business?.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{upcomingAppointment.service}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500"><HiOutlineCalendar className="w-3 h-3" /> {new Date(upcomingAppointment.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500"><HiOutlineClock className="w-3 h-3" /> {upcomingAppointment.timeSlot}</span>
                      {upcomingAppointment.tokenNumber && (
                        <span className="text-xs font-bold text-primary">Q{String(upcomingAppointment.tokenNumber).padStart(3, '0')}</span>
                      )}
                    </div>
                  </div>
                  <HiOutlineArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                </div>
              </Link>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Book', icon: HiOutlineCalendar, path: '/customer/nearby', color: 'bg-primary-50 text-primary' },
                { label: 'Queue', icon: HiOutlineUsers, path: '/customer/queue', color: 'bg-emerald-50 text-emerald-600' },
                { label: 'Nearby', icon: HiOutlineLocationMarker, path: '/customer/nearby', color: 'bg-amber-50 text-amber-600' },
              ].map((action) => (
                <Link key={action.label} to={action.path} className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-5 card-shadow flex flex-col items-center gap-3 card-shadow-hover transition-all">
                  <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Smart Arrival */}
          <SmartArrivalWidget />
        </div>

        {/* Middle: Nearby Services */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nearby Services</h2>
            <Link to="/customer/nearby" className="text-sm font-medium text-primary hover:text-primary-dark flex items-center gap-1 transition-colors">
              View all <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {nearbyBusinesses?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {nearbyBusinesses.slice(0, 3).map((biz) => (
                <div key={biz._id} className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 card-shadow card-shadow-hover cursor-pointer transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <HiOutlineLocationMarker className="w-6 h-6 text-primary" />
                    </div>
                    {biz.distance && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        {biz.distance < 1000 ? `${Math.round(biz.distance)}m` : `${(biz.distance / 1000).toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{biz.name}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 capitalize mb-3">{biz.category}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <HiOutlineStar className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{biz.rating?.toFixed(1) || 'New'}</span>
                    </div>
                    <span className="text-xs font-semibold text-primary">Book Now</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-12 text-center card-shadow">
              <HiOutlineLocationMarker className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No businesses available nearby</p>
            </div>
          )}
        </div>

        {/* Bottom Section: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Appointments */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 card-shadow">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Appointments</h2>
              <Link to="/customer/appointments" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">View all</Link>
            </div>
            {recentAppointments?.length > 0 ? (
              <div className="space-y-3">
                {recentAppointments.slice(0, 4).map((apt) => (
                  <div key={apt._id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center flex-shrink-0 border border-slate-100 dark:border-slate-800">
                      <HiOutlineCalendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{apt.business?.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{apt.service} &middot; {new Date(apt.date).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={apt.status} size="sm">{apt.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <HiOutlineCalendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No appointments yet</p>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 card-shadow">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </div>
            {unreadNotifications?.length > 0 ? (
              <div className="space-y-3">
                {unreadNotifications.slice(0, 4).map((n) => (
                  <div key={n._id} className="flex items-start gap-3 p-4 rounded-xl bg-primary-50/50 border border-primary-100/50">
                    <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <HiOutlineBell className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <HiOutlineBell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No new notifications</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
