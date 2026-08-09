import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineCheck } from 'react-icons/hi';
import { customerAPI, appointmentAPI } from '../../services/api';

const BookPage = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchBusiness();
  }, [businessId]);

  const fetchBusiness = async () => {
    try {
      const response = await customerAPI.getNearby({});
      const biz = response.data.businesses?.find((b) => b._id === businessId);
      setBusiness(biz || null);
      setService(biz?.services?.[0]?.name || 'General Service');
      const today = new Date();
      setSelectedDate(today.toISOString().split('T')[0]);
    } catch (error) {
      console.error('Failed to fetch business:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNext14Days = () => {
    const days = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        num: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
      });
    }
    return days;
  };

  const timeSlots = {
    Morning: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
    Afternoon: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'],
    Evening: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30'],
  };

  const handleBook = async () => {
    if (!service || !selectedDate || !selectedTime) {
      setMessage({ type: 'error', text: 'Please select a service, date and time' });
      return;
    }

    setBooking(true);
    setMessage({ type: '', text: '' });

    try {
      await appointmentAPI.create({
        business: businessId,
        service,
        date: selectedDate,
        timeSlot: selectedTime,
      });
      setMessage({ type: 'success', text: 'Appointment booked successfully!' });
      setTimeout(() => navigate('/customer/appointments'), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to book appointment' });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Business Not Found</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">This business is no longer available</p>
        <button
          onClick={() => navigate('/customer/nearby')}
          className="mt-4 px-4 py-2 text-xs font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
        >
          Back to Nearby
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-[700px] mx-auto space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Book Appointment
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {business?.name}
        </p>
      </div>

      {business.services?.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Select Service</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {business.services.map((s) => (
              <button
                key={s.name}
                onClick={() => setService(s.name)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                  service === s.name
                    ? 'bg-primary/10 border border-primary text-zinc-900 dark:text-zinc-100'
                    : 'bg-zinc-50 dark:bg-zinc-800 border border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }`}
              >
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {s.duration} min{s.price ? ` · $${s.price}` : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineCalendar className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Select Date</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {getNext14Days().map((day) => (
            <button
              key={day.date}
              onClick={() => setSelectedDate(day.date)}
              className={`flex-shrink-0 w-16 py-3 rounded-xl text-center transition-all ${
                selectedDate === day.date
                  ? 'bg-primary text-white'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <p className="text-xs font-medium">{day.day}</p>
              <p className="text-lg font-bold mt-0.5">{day.num}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineClock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Select Time</h2>
        </div>
        <div className="space-y-4">
          {Object.entries(timeSlots).map(([period, slots]) => (
            <div key={period}>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">{period}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`h-12 text-xs font-medium rounded-xl transition-all ${
                      selectedTime === time
                        ? 'bg-gradient-to-r from-primary to-indigo-500 text-white shadow-lg shadow-primary/25'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedDate && selectedTime && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Booking Summary</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Business</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{business?.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Service</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{service}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Date</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedDate}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Time</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedTime}</span>
            </div>
          </div>
        </div>
      )}

      {message.text && (
        <div className={`p-3 rounded-xl text-xs font-medium ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <button
        onClick={handleBook}
        disabled={!selectedDate || !selectedTime || booking}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {booking ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <HiOutlineCheck className="w-4 h-4" />
            Confirm Booking
          </>
        )}
      </button>
    </motion.div>
  );
};

export default BookPage;
