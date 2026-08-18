import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCalendar, HiOutlineClock } from 'react-icons/hi';
import { HiOutlineXMark, HiOutlineArrowPath, HiOutlineCreditCard, HiOutlineCheckCircle } from 'react-icons/hi2';
import { appointmentAPI } from '../../services/api';
import Badge from '../../components/ui/Badge';
import VerifiedBadge from '../../components/ui/VerifiedBadge';

const tabs = ['Upcoming', 'Past', 'All'];

const statusVariant = {
  confirmed: 'confirmed',
  pending: 'pending',
  scheduled: 'scheduled',
  checked_in: 'checked_in',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show: 'no_show',
  skipped: 'skipped',
};

const statusLabel = {
  in_progress: 'In Progress',
  no_show: 'No Show',
  scheduled: 'Scheduled',
  checked_in: 'Checked In',
  skipped: 'Skipped',
};

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [busyId, setBusyId] = useState(null);
  const [checkingInId, setCheckingInId] = useState(null);
  const [rescheduleFor, setRescheduleFor] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getAll();
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'Upcoming') return ['pending', 'confirmed', 'scheduled', 'checked_in', 'in_progress'].includes(apt.status);
    if (activeTab === 'Past') return ['completed', 'cancelled', 'no_show', 'skipped'].includes(apt.status);
    return true;
  });

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment? Your queue token will also be removed.')) return;
    setBusyId(id);
    try {
      await appointmentAPI.cancel(id);
      await fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel appointment');
    }
    setBusyId(null);
  };

  const handleCheckIn = async (id) => {
    setCheckingInId(id);
    try {
      const res = await appointmentAPI.checkIn(id);
      alert(
        res.data?.late
          ? `Your appointment time has passed, but you have been placed in the queue. Token Q${res.data?.queue?.tokenNumber}. Please check in with the staff.`
          : `You are now in the queue with token Q${res.data?.queue?.tokenNumber}.`
      );
      await fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.message || 'Could not check in right now.');
    }
    setCheckingInId(null);
  };

  const openReschedule = (apt) => {
    setRescheduleFor(apt);
    setNewDate(apt.date?.split('T')[0] || '');
    setNewTime(apt.timeSlot || '');
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) { alert('Please pick a new date and time'); return; }
    setBusyId(rescheduleFor._id);
    try {
      await appointmentAPI.reschedule(rescheduleFor._id, { date: newDate, timeSlot: newTime });
      setRescheduleFor(null);
      await fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reschedule appointment');
    }
    setBusyId(null);
  };

  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
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
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Appointments
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your upcoming and past appointments
        </p>
      </div>

      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineCalendar className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No {activeTab !== 'All' ? activeTab : ''} Appointments
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            {activeTab === 'Upcoming'
              ? 'Book an appointment to get started'
              : 'Your past appointments will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((appointment) => (
            <div
              key={appointment._id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <HiOutlineCalendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                      {appointment.business?.name || 'Business'}
                      <VerifiedBadge />
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {appointment.service}
                    </p>
                  </div>
                </div>
                <Badge variant={statusVariant[appointment.status] || 'default'}>
                  {statusLabel[appointment.status] || appointment.status}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <HiOutlineCalendar className="w-3.5 h-3.5" />
                  {formatDate(appointment.date)}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <HiOutlineClock className="w-3.5 h-3.5" />
                  {appointment.timeSlot || '—'}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Token {appointment.tokenNumber ?? '—'}
                </span>
                {(appointment.paymentStatus === 'pending' || appointment.paymentStatus === 'failed') && (
                  <a
                    href={`/customer/appointments/${appointment._id}/pay`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                  >
                    <HiOutlineCreditCard className="w-3.5 h-3.5" /> Advance pending · Pay
                  </a>
                )}
                {appointment.paymentStatus === 'paid' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-full">
                    Advance paid
                  </span>
                )}
                <div className="flex-1" />
                {appointment.status === 'checked_in' && appointment.queueEntryId && (
                  <a
                    href="/customer/queue"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors"
                  >
                    <HiOutlineCheckCircle className="w-3.5 h-3.5" /> In queue · Track
                  </a>
                )}
                {!appointment.queueEntryId && ['pending', 'confirmed', 'scheduled'].includes(appointment.status) && (
                  <button
                    onClick={() => handleCheckIn(appointment._id)}
                    disabled={checkingInId === appointment._id}
                    className="px-3 py-1.5 text-[11px] font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <HiOutlineCheckCircle className="w-3.5 h-3.5" /> {checkingInId === appointment._id ? 'Checking in…' : 'Check in'}
                  </button>
                )}
                {['pending', 'confirmed'].includes(appointment.status) && (
                  <>
                    <button
                      onClick={() => openReschedule(appointment)}
                      disabled={busyId === appointment._id}
                      className="px-3 py-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <HiOutlineArrowPath className="w-3.5 h-3.5" /> Reschedule
                    </button>
                    <button
                      onClick={() => handleCancel(appointment._id)}
                      disabled={busyId === appointment._id}
                      className="px-3 py-1.5 text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <HiOutlineXMark className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {rescheduleFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setRescheduleFor(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-100 dark:border-zinc-800 shadow-xl"
            >
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">Reschedule Appointment</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
                {rescheduleFor.business?.name} • {rescheduleFor.service}
              </p>

              <label className="block text-[13px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">New Date</label>
              <input
                type="date"
                value={newDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all mb-4"
              />

              <label className="block text-[13px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">New Time</label>
              <div className="grid grid-cols-4 gap-2 mb-5 max-h-44 overflow-y-auto">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setNewTime(time)}
                    className={`h-10 text-xs font-medium rounded-xl transition-all ${
                      newTime === time
                        ? 'bg-gradient-to-r from-primary to-indigo-500 text-white shadow-lg shadow-primary/25'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setRescheduleFor(null)}
                  className="flex-1 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={busyId === rescheduleFor._id || !newDate || !newTime}
                  className="flex-1 h-10 rounded-xl gradient-primary text-white text-sm font-semibold disabled:opacity-40 transition-all"
                >
                  {busyId === rescheduleFor._id ? 'Saving...' : 'Confirm New Time'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AppointmentsPage;
