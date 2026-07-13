import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import Badge from '../../components/ui/Badge';
import {
  HiOutlineCalendar, HiOutlineUsers, HiOutlineClock, HiOutlineLocationMarker,
  HiOutlineBell, HiOutlineStar, HiOutlineArrowRight
} from 'react-icons/hi';

export default function CustomerDashboardPage() {
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
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const { upcomingAppointment, activeQueue, queueStatus, recentAppointments, unreadNotifications, unreadCount, nearbyBusinesses } = data || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Upcoming Appointment */}
      {upcomingAppointment && (
        <div className="mb-10">
          <Link to="/customer/appointments" className="block bg-white rounded-2xl border border-slate-100 p-6 card-shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Next Appointment</h2>
              <Badge variant={upcomingAppointment.status === 'confirmed' ? 'confirmed' : 'pending'}>{upcomingAppointment.status}</Badge>
            </div>
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <HiOutlineCalendar className="w-7 h-7 text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-800">{upcomingAppointment.business?.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{upcomingAppointment.service}</p>
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400"><HiOutlineCalendar className="w-3.5 h-3.5" /> {new Date(upcomingAppointment.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400"><HiOutlineClock className="w-3.5 h-3.5" /> {upcomingAppointment.timeSlot}</span>
                  {upcomingAppointment.tokenNumber && (
                    <span className="text-xs font-bold text-indigo-600">Q{String(upcomingAppointment.tokenNumber).padStart(3, '0')}</span>
                  )}
                </div>
              </div>
              <HiOutlineArrowRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
            </div>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Live Queue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Live Queue</h2>
          {activeQueue ? (
            <div>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <HiOutlineUsers className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{activeQueue.business?.name}</p>
                  <p className="text-xs text-slate-400">Token Q{String(activeQueue.tokenNumber).padStart(3, '0')}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">Current</p>
                  <p className="text-lg font-bold text-indigo-600">Q{String(queueStatus?.currentToken || '-').padStart(3, '0')}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">Ahead</p>
                  <p className="text-lg font-bold text-slate-900">{queueStatus?.peopleAhead || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">Wait</p>
                  <p className="text-lg font-bold text-amber-600">~{queueStatus?.estimatedWaitTime || 0}m</p>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${queueStatus?.peopleAhead > 0 ? Math.min((queueStatus.currentToken / activeQueue.tokenNumber) * 100, 95) : 0}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
              <Link to="/customer/queue" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                View Details <HiOutlineArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <HiOutlineUsers className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">Not in any queue</p>
              <Link to="/customer/nearby" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">Find services nearby</Link>
            </div>
          )}
        </div>

        {/* Nearby Services */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Nearby Services</h2>
          {nearbyBusinesses?.length > 0 ? (
            <div className="space-y-3">
              {nearbyBusinesses.slice(0, 3).map((biz) => (
                <div key={biz._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <HiOutlineLocationMarker className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{biz.name}</p>
                    <p className="text-xs text-slate-400 truncate">{biz.category}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <HiOutlineStar className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-600">{biz.rating?.toFixed(1) || 'New'}</span>
                  </div>
                </div>
              ))}
              <Link to="/customer/nearby" className="flex items-center justify-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 pt-2">
                View all <HiOutlineArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">No businesses available</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Recent Appointments */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Appointments</h2>
          {recentAppointments?.length > 0 ? (
            <div className="space-y-3">
              {recentAppointments.slice(0, 4).map((apt) => (
                <div key={apt._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <HiOutlineCalendar className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{apt.business?.name}</p>
                    <p className="text-xs text-slate-400">{apt.service} &middot; {new Date(apt.date).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={apt.status} size="sm">{apt.status}</Badge>
                </div>
              ))}
              <Link to="/customer/appointments" className="flex items-center justify-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 pt-2">
                View all <HiOutlineArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">No appointments yet</p>
              <Link to="/customer/nearby" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">Book a service</Link>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{unreadCount}</span>
            )}
          </div>
          {unreadNotifications?.length > 0 ? (
            <div className="space-y-3">
              {unreadNotifications.slice(0, 4).map((n) => (
                <div key={n._id} className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50/50">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <HiOutlineBell className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  </div>
                </div>
              ))}
              <Link to="/customer/notifications" className="flex items-center justify-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 pt-2">
                View all <HiOutlineArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <HiOutlineBell className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">No new notifications</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
