import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineCheck, HiOutlineUserGroup, HiOutlineCreditCard, HiOutlineSparkles, HiOutlineArrowRight } from 'react-icons/hi2';
import { customerAPI, appointmentAPI } from '../../services/api';
import VerifiedBadge from '../../components/ui/VerifiedBadge';
import { CrowdLevelBadge, SourceNote } from '../../components/crowd/CrowdTiming';

const STAFF_DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const dayNameForDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return STAFF_DAY_NAMES[d.getDay()];
};

const isStaffAvailableOnDate = (member, dateStr) => {
  if (!member || member.isActive === false) return false;
  const dayName = dayNameForDate(dateStr);
  if (!dayName) return false;
  const day = member.availability && member.availability[dayName];
  if (!day || day.off) return false;
  return Boolean(day.open && day.close);
};

const BookPage = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [liveQueue, setLiveQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [service, setService] = useState('');
  const [staff, setStaff] = useState('any');
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [bestTimes, setBestTimes] = useState(null);
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const fetchBusiness = useCallback(async () => {
    try {
      const response = await customerAPI.getBusinessPublic(businessId);
      const biz = response.data.business;
      setBusiness(biz);
      setLiveQueue(response.data.liveQueue);
      const firstAvailable = (biz.services || []).find((s) => s.isAvailable !== false);
      setService(firstAvailable?.name || '');
      const today = new Date();
      setSelectedDate(today.toISOString().split('T')[0]);
    } catch (error) {
      setLoadError(error.response?.data?.message || 'Business not found');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  const fetchSlots = useCallback(async () => {
    if (!businessId || !selectedDate || !service) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSelectedTime(null);
    try {
      const res = await customerAPI.getSlots({
        business: businessId,
        date: selectedDate,
        staff: staff === 'any' ? undefined : staff,
        service,
      });
      setSlots(res.data.slots || []);
    } catch (error) {
      setSlots([]);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load time slots' });
    } finally {
      setLoadingSlots(false);
    }
  }, [businessId, selectedDate, service, staff]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    if (staff === 'any' || !business) return;
    const member = (business.staff || []).find((m) => String(m._id) === String(staff));
    if (member && !isStaffAvailableOnDate(member, selectedDate)) {
      setStaff('any');
      setSelectedTime(null);
    }
  }, [business, staff, selectedDate]);

  useEffect(() => {
    if (!businessId) return;
    customerAPI.getBestTimes(businessId)
      .then((res) => setBestTimes(res.data))
      .catch(() => {});
  }, [businessId]);

  useEffect(() => {
    const svc = (business?.services || []).find((s) => s.name === service && s.isAvailable !== false);
    if (!businessId || !selectedDate || !selectedTime || !svc) {
      setInsight(null);
      return;
    }
    let cancelled = false;
    setInsightLoading(true);
    customerAPI.getExpectedQueue(businessId, {
      date: selectedDate,
      time: selectedTime,
      serviceId: svc._id,
      staff: staff === 'any' ? undefined : staff,
    })
      .then((res) => { if (!cancelled) setInsight(res.data); })
      .catch(() => { if (!cancelled) setInsight(null); })
      .finally(() => { if (!cancelled) setInsightLoading(false); });
    return () => { cancelled = true; };
  }, [businessId, selectedDate, selectedTime, service, staff, business]);

  const recommendation = (() => {
    if (!bestTimes?.best?.length) return null;
    const sameDay = bestTimes.best.find((b) => b.date === selectedDate);
    return sameDay || bestTimes.best[0];
  })();

  const jumpToRecommendation = () => {
    if (!recommendation) return;
    setSelectedDate(recommendation.date);
    setSelectedTime(recommendation.time);
  };

  const selectedService = (business?.services || []).find(
    (s) => s.name === service && s.isAvailable !== false
  );
  const eligibleStaff = (business?.staff || []).filter((m) => {
    if (m.isActive === false) return false;
    if (!selectedService?._id) return true;
    return (m.services || []).some((id) => String(id) === String(selectedService._id));
  });

  const handleServiceChange = (name) => {
    setService(name);
    setStaff('any');
    setSelectedTime(null);
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

  const groupSlots = () => {
    const groups = { Morning: [], Afternoon: [], Evening: [] };
    for (const slot of slots) {
      const hour = parseInt(slot.split(':')[0], 10);
      if (hour < 12) groups.Morning.push(slot);
      else if (hour < 16) groups.Afternoon.push(slot);
      else groups.Evening.push(slot);
    }
    return Object.entries(groups).filter(([, list]) => list.length > 0);
  };

  const handleBook = async () => {
    if (!service || !selectedDate || !selectedTime) {
      setMessage({ type: 'error', text: 'Please select a service, date and time' });
      return;
    }
    setBooking(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await appointmentAPI.create({
        business: businessId,
        service,
        date: selectedDate,
        timeSlot: selectedTime,
        staff: staff === 'any' ? undefined : staff,
        bookingType: 'advance',
      });
      if (res.data.paymentRequired) {
        navigate(`/customer/appointments/${res.data.appointment._id}/pay`);
        return;
      }
      setMessage({ type: 'success', text: 'Appointment booked successfully!' });
      setTimeout(() => navigate('/customer/appointments'), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to book appointment' });
      fetchSlots();
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

  if (!business || loadError) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Business Not Found</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">{loadError || 'This business is no longer available'}</p>
        <button
          onClick={() => navigate('/customer/nearby')}
          className="mt-4 px-4 py-2 text-xs font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
        >
          Back to Nearby
        </button>
      </div>
    );
  }

  const notAcceptingBookings =
    !business.isActive ||
    business.approvalStatus !== 'approved' ||
    (business.businessStatus && business.businessStatus !== 'active');

  const payments = business.payments || {};
  const requirePayment = Boolean(payments.requirePayment);

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
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
          {business.name}
          <VerifiedBadge />
        </p>
        {liveQueue && (
          <p className="text-xs text-zinc-400 mt-0.5">
            Currently {liveQueue.waiting} waiting · est. wait {liveQueue.estimatedWait}m
          </p>
        )}
      </div>

      {notAcceptingBookings ? (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-6 text-center">
          <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Bookings are currently closed</h3>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">This business is not accepting new bookings right now.</p>
        </div>
      ) : (
        <>
          {(business.services?.filter((s) => s.isAvailable !== false).length > 0) && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Select Service</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {business.services.filter((s) => s.isAvailable !== false).map((s) => (
                  <button
                    key={String(s._id)}
                    onClick={() => handleServiceChange(s.name)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                      service === s.name
                        ? 'bg-primary/10 border border-primary text-zinc-900 dark:text-zinc-100'
                        : 'bg-zinc-50 dark:bg-zinc-800 border border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {s.duration} min{s.price ? ` · ₹${s.price}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {eligibleStaff.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineUserGroup className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Choose Professional</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => { setStaff('any'); setSelectedTime(null); }}
                  className={`px-4 py-3 rounded-xl text-left transition-all ${
                    staff === 'any'
                      ? 'bg-primary/10 border border-primary text-zinc-900 dark:text-zinc-100'
                      : 'bg-zinc-50 dark:bg-zinc-800 border border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  <span className="text-sm font-medium">Any professional</span>
                  <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">First available</span>
                </button>
                {eligibleStaff.map((m) => {
                  const unavailable = !isStaffAvailableOnDate(m, selectedDate);
                  return (
                    <button
                      key={String(m._id)}
                      disabled={unavailable}
                      onClick={() => { setStaff(String(m._id)); setSelectedTime(null); }}
                      className={`px-4 py-3 rounded-xl text-left transition-all ${
                        unavailable
                          ? 'bg-zinc-50 dark:bg-zinc-800 border border-dashed border-zinc-200 dark:border-zinc-700 opacity-50 cursor-not-allowed'
                          : staff === String(m._id)
                            ? 'bg-primary/10 border border-primary text-zinc-900 dark:text-zinc-100'
                            : 'bg-zinc-50 dark:bg-zinc-800 border border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <span className="text-sm font-medium">{m.name}</span>
                      <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {unavailable ? 'Unavailable on this date' : (m.role || 'Professional')}
                      </span>
                    </button>
                  );
                })}
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
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
                No available slots for this date{staff !== 'any' ? ' with this professional' : ''}. Try another day.
              </p>
            ) : (
              <div className="space-y-4">
                {groupSlots().map(([period, list]) => (
                  <div key={period}>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">{period}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {list.map((time) => (
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
            )}
          </div>

          {selectedDate && selectedTime && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                  <HiOutlineSparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">QueueBook Insight</h2>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Expected crowd &amp; wait for your chosen slot</p>
                </div>
              </div>

              {insightLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              ) : insight?.status === 'ok' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3 text-center">
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Expected queue</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">{insight.expectedQueue}</p>
                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500">ahead of you</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3 text-center">
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Expected wait</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">~{insight.expectedWait}m</p>
                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500">{insight.activeStaff} staff on duty</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3 text-center flex flex-col items-center justify-center">
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Crowd level</p>
                      <div className="mt-1"><CrowdLevelBadge level={insight.crowdLevel} /></div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{insight.message}</p>

                  {recommendation && recommendation.time !== selectedTime && (
                    <button
                      onClick={jumpToRecommendation}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-xs bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                    >
                      <span className="text-amber-700 dark:text-amber-400 font-medium">
                        Prefer a quieter time? {recommendation.date === selectedDate ? 'Today' : 'Try'} {recommendation.time} is often quieter.
                      </span>
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold flex-shrink-0">
                        Change time <HiOutlineArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  )}

                  <SourceNote source={insight.dataSource} />
                </div>
              ) : insight ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">{insight.message}</p>
              ) : null}
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Booking Summary</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Business</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{business.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Service</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {service}{selectedService?.price ? ` · ₹${selectedService.price}` : ''}
                  </span>
                </div>
                {staff !== 'any' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Professional</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {eligibleStaff.find((m) => String(m._id) === String(staff))?.name || '—'}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Date</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedDate}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Time</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedTime}</span>
                </div>
                {requirePayment && (
                  <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <HiOutlineCreditCard className="w-3.5 h-3.5" /> Advance
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">₹{Number(payments.advanceAmount) || 0}</span>
                  </div>
                )}
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
        </>
      )}
    </motion.div>
  );
};

export default BookPage;
