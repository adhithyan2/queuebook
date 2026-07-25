import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { customerAPI, appointmentAPI } from '../../services/api';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineLocationMarker, HiOutlineArrowLeft, HiOutlineCheck, HiOutlineStar, HiOutlineUser, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineSparkles } from 'react-icons/hi';

function generateTimeSlots(open, close, interval) {
  const slots = [];
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  let start = oh * 60 + om;
  const end = ch * 60 + cm;
  while (start + interval <= end) {
    const h = Math.floor(start / 60);
    const m = start % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    start += interval;
  }
  return slots;
}

function getSlotPeriod(time) {
  const hour = parseInt(time.split(':')[0]);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function getDates(count = 14) {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      date: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: i === 0,
    });
  }
  return dates;
}

const categoryColors = {
  hospital: '#EF4444', clinic: '#8B5CF6', salon: '#EC4899',
  restaurant: '#F59E0B', office: '#3B82F6', laboratory: '#10B981',
};

export default function CustomerBookPage() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [success, setSuccess] = useState(null);
  const [dateScroll, setDateScroll] = useState(0);

  useEffect(() => {
    customerAPI.getNearby({})
      .then(res => { const biz = res.data.businesses.find(b => b._id === businessId); if (biz) setBusiness(biz); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessId]);

  const dates = getDates(14);
  const timeSlots = business ? generateTimeSlots(business.timeSlots?.open || '09:00', business.timeSlots?.close || '17:00', business.timeSlots?.interval || 30) : [];

  const morningSlots = timeSlots.filter(s => getSlotPeriod(s) === 'morning');
  const afternoonSlots = timeSlots.filter(s => getSlotPeriod(s) === 'afternoon');
  const eveningSlots = timeSlots.filter(s => getSlotPeriod(s) === 'evening');

  const estimatedWait = selectedSlot && business?.avgServiceTime
    ? Math.max(0, (timeSlots.indexOf(selectedSlot)) * (business.avgServiceTime || 5))
    : null;

  const handleBook = async () => {
    if (!service || !selectedDate || !selectedSlot) return;
    setSaving(true);
    try {
      const res = await appointmentAPI.create({ business: businessId, service, date: selectedDate, timeSlot: selectedSlot });
      setSuccess(res.data.appointment);
    } catch { setSuccess({ error: true }); }
    finally { setSaving(false); }
  };

  const selectedDateObj = dates.find(d => d.date === selectedDate);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-[#7C3AED]/20 border-t-[#7C3AED] rounded-full animate-spin" />
    </div>
  );

  if (!business) return (
    <div className="text-center py-20">
      <p className="text-sm text-slate-500 dark:text-slate-400">Business not found</p>
      <button onClick={() => navigate('/customer/nearby')} className="mt-4 text-sm font-semibold text-[#7C3AED]">Back to Nearby</button>
    </div>
  );

  const catColor = categoryColors[business.category] || '#7C3AED';

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[700px] mx-auto">
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-white dark:bg-slate-900 rounded-[24px] p-10 text-center"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2, damping: 15 }}
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            <HiOutlineCheck className="w-10 h-10 text-white" strokeWidth={3} />
          </motion.div>
          <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-2">Booking Confirmed!</h2>
          <p className="text-[#6B7280] dark:text-slate-400 mb-8">Your appointment has been booked successfully</p>

          <div className="rounded-[20px] p-6 mb-8" style={{ background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)' }}>
            <p className="text-xs font-semibold text-[#7C3AED] uppercase tracking-wider mb-2">Your Token</p>
            <p className="text-5xl font-extrabold text-[#7C3AED]">Q{String(success.tokenNumber).padStart(3, '0')}</p>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-[#6B7280] dark:text-slate-400 mb-8">
            <span className="flex items-center gap-2"><HiOutlineCalendar className="w-4 h-4 text-[#7C3AED]" /> {new Date(success.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span className="flex items-center gap-2"><HiOutlineClock className="w-4 h-4 text-[#7C3AED]" /> {success.timeSlot}</span>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/customer/queue')} className="flex-1 h-12 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
              View Queue
            </button>
            <button onClick={() => navigate('/customer/nearby')} className="flex-1 h-12 rounded-xl font-semibold text-sm border border-[#E5E7EB] dark:border-slate-700 text-[#6B7280] dark:text-slate-400 hover:bg-[#F9FAFB] dark:hover:bg-slate-800 transition-all active:scale-[0.98]">
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-[700px] mx-auto">

      <button onClick={() => navigate('/customer/nearby')} className="flex items-center gap-2 text-sm font-medium text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200 mb-8 transition-colors group">
        <HiOutlineArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Nearby
      </button>

      {/* ─── Business Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white dark:bg-slate-900 rounded-[24px] p-8 mb-6"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[18px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${catColor}12` }}>
            <HiOutlineLocationMarker className="w-7 h-7" style={{ color: catColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-[#111827] dark:text-slate-100 truncate">{business.name}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-sm font-medium capitalize" style={{ color: catColor }}>{business.category}</span>
              {business.rating > 0 && (
                <span className="flex items-center gap-1 text-sm text-[#6B7280] dark:text-slate-400">
                  <HiOutlineStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {business.rating.toFixed(1)}
                </span>
              )}
            </div>
            {business.address && (
              <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-1 line-clamp-1">{business.address}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ─── Service Input ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900 rounded-[24px] p-8 mb-6"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}
      >
        <h2 className="text-base font-bold text-[#111827] dark:text-slate-100 mb-4">Service</h2>
        <input
          type="text" value={service} onChange={e => setService(e.target.value)}
          placeholder="e.g. Haircut, Consultation, Checkup..."
          className="w-full h-12 rounded-xl border border-[#E5E7EB] dark:border-slate-700 px-4 text-sm text-[#111827] dark:text-slate-200 placeholder-[#9CA3AF] dark:placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 transition-all bg-[#F9FAFB] dark:bg-slate-800/50"
        />
      </motion.div>

      {/* ─── Date Selector ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white dark:bg-slate-900 rounded-[24px] p-8 mb-6"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}
      >
        <h2 className="text-base font-bold text-[#111827] dark:text-slate-100 mb-5">Select Date</h2>
        <div className="relative">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {dates.map((d, i) => (
              <motion.button
                key={d.date}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelectedDate(d.date); setSelectedSlot(''); }}
                className={`flex flex-col items-center min-w-[68px] h-[76px] rounded-[16px] px-3 py-3 transition-all duration-200 flex-shrink-0 ${
                  selectedDate === d.date
                    ? 'text-white shadow-lg shadow-[#7C3AED]/25'
                    : 'bg-[#F9FAFB] dark:bg-slate-800/50 text-[#6B7280] dark:text-slate-400 hover:bg-[#F3F4F6] dark:hover:bg-slate-600/50'
                }`}
                style={selectedDate === d.date ? { background: 'linear-gradient(135deg, #7C3AED, #A855F7)' } : {}}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{d.isToday ? 'Today' : d.day}</span>
                <span className="text-xl font-bold mt-0.5">{d.dayNum}</span>
                <span className="text-[10px] font-medium opacity-70">{d.month}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Time Slots ─── */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white dark:bg-slate-900 rounded-[24px] p-8 mb-6"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}
          >
            <h2 className="text-base font-bold text-[#111827] dark:text-slate-100 mb-5">Select Time</h2>

            {[
              { label: 'Morning', slots: morningSlots, icon: '🌅' },
              { label: 'Afternoon', slots: afternoonSlots, icon: '☀️' },
              { label: 'Evening', slots: eveningSlots, icon: '🌙' },
            ].map(({ label, slots, icon }) => slots.length > 0 && (
              <div key={label} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">{icon}</span>
                  <h3 className="text-sm font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">{label}</h3>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {slots.map(slot => (
                    <motion.button
                      key={slot}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedSlot(slot)}
                      className={`h-12 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        selectedSlot === slot
                          ? 'text-white shadow-lg shadow-[#7C3AED]/25'
                          : 'bg-[#F9FAFB] dark:bg-slate-800/50 text-[#6B7280] dark:text-slate-400 hover:bg-[#F3F4F6] dark:hover:bg-slate-600/50 hover:text-[#111827] dark:hover:text-slate-200'
                      }`}
                      style={selectedSlot === slot ? { background: 'linear-gradient(135deg, #7C3AED, #A855F7)' } : {}}
                    >
                      {slot}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Choose Staff (Optional) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-900 rounded-[24px] p-8 mb-6"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}
      >
        <h2 className="text-base font-bold text-[#111827] dark:text-slate-100 mb-1">Choose Staff</h2>
        <p className="text-xs text-[#9CA3AF] dark:text-slate-500 mb-5">Optional — leave blank for any available staff</p>
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {['Any Staff', 'Staff 1', 'Staff 2'].map((name, i) => (
            <motion.button
              key={name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i === 0
                  ? 'bg-gradient-to-br from-[#7C3AED] to-[#A855F7] text-white shadow-lg shadow-[#7C3AED]/20'
                  : 'bg-[#F3F4F6] dark:bg-slate-800 text-[#6B7280] dark:text-slate-400'
              }`}>
                {i === 0 ? <HiOutlineSparkles className="w-5 h-5" /> : name.charAt(name.length - 1)}
              </div>
              <span className="text-[11px] font-medium text-[#6B7280] dark:text-slate-400">{name}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ─── Booking Summary ─── */}
      <AnimatePresence>
        {selectedDate && selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-[24px] p-8 mb-8"
            style={{ background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <HiOutlineSparkles className="w-4 h-4 text-[#7C3AED]" />
              <h2 className="text-base font-bold text-[#7C3AED]">Booking Summary</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Business', value: business.name },
                { label: 'Service', value: service || '—' },
                { label: 'Date', value: selectedDateObj ? `${selectedDateObj.isToday ? 'Today, ' : ''}${selectedDateObj.day} ${selectedDateObj.dayNum} ${selectedDateObj.month}` : '—' },
                { label: 'Time', value: selectedSlot },
                { label: 'Estimated Wait', value: estimatedWait !== null ? `~${estimatedWait} min` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-[#7C3AED]/70">{label}</span>
                  <span className="text-sm font-semibold text-[#111827] dark:text-slate-200">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Confirm Button ─── */}
      <motion.button
        whileHover={service && selectedDate && selectedSlot ? { scale: 1.01, boxShadow: '0 12px 40px rgba(124,58,237,0.3)' } : {}}
        whileTap={service && selectedDate && selectedSlot ? { scale: 0.98 } : {}}
        onClick={handleBook}
        disabled={!service || !selectedDate || !selectedSlot || saving}
        className="w-full h-[52px] rounded-[14px] text-white font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        style={{ background: service && selectedDate && selectedSlot ? 'linear-gradient(135deg, #7C3AED, #A855F7)' : '#D1D5DB' }}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Booking...
          </span>
        ) : (
          'Confirm Booking'
        )}
      </motion.button>
    </motion.div>
  );
}
