import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { customerAPI, appointmentAPI } from '../../services/api';
import Button from '../../components/ui/Button';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineLocationMarker, HiOutlineArrowLeft } from 'react-icons/hi';

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

  useEffect(() => {
    customerAPI.getNearby({})
      .then(res => {
        const biz = res.data.businesses.find(b => b._id === businessId);
        if (biz) setBusiness(biz);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessId]);

  const today = new Date().toISOString().split('T')[0];
  const timeSlots = business ? generateTimeSlots(
    business.timeSlots?.open || '09:00',
    business.timeSlots?.close || '17:00',
    business.timeSlots?.interval || 30
  ) : [];

  const handleBook = async () => {
    if (!service || !selectedDate || !selectedSlot) return;
    setSaving(true);
    try {
      const res = await appointmentAPI.create({
        business: businessId,
        service,
        date: selectedDate,
        timeSlot: selectedSlot,
      });
      setSuccess(res.data.appointment);
    } catch {
      setSuccess({ error: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">Business not found</p>
        <button onClick={() => navigate('/customer/nearby')} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700">Back to Nearby</button>
      </div>
    );
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto px-4 sm:px-0">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 card-shadow text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <HiOutlineCalendar className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
          <p className="text-sm text-slate-500 mb-6">{business.name}</p>
          <div className="bg-indigo-50 rounded-2xl p-5 mb-6">
            <p className="text-xs text-indigo-500 mb-1">Your Token</p>
            <p className="text-4xl font-bold text-indigo-600">Q{String(success.tokenNumber).padStart(3, '0')}</p>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-600 mb-6">
            <span className="flex items-center gap-1.5"><HiOutlineCalendar className="w-4 h-4" /> {new Date(success.date).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><HiOutlineClock className="w-4 h-4" /> {success.timeSlot}</span>
          </div>
          <div className="flex gap-4 justify-center">
            <Button variant="gradient" onClick={() => navigate('/customer/queue')}>View Queue</Button>
            <Button variant="secondary" onClick={() => navigate('/customer/nearby')}>Done</Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto px-4 sm:px-0">
      <button onClick={() => navigate('/customer/nearby')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <HiOutlineArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 card-shadow mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <HiOutlineLocationMarker className="w-7 h-7 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{business.name}</h1>
            <p className="text-sm text-slate-500 capitalize">{business.category}</p>
            {business.address && <p className="text-xs text-slate-400 mt-1">{business.address}</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Service</label>
            <input type="text" value={service} onChange={e => setService(e.target.value)}
              placeholder="e.g. Haircut, Checkup, etc."
              className="w-full h-[56px] rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={today}
              className="w-full h-[56px] rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
          </div>

          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Time Slot</label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(slot => (
                  <button key={slot} type="button" onClick={() => setSelectedSlot(slot)}
                    className={`p-2.5 rounded-xl border-2 text-center text-xs font-medium transition-all ${
                      selectedSlot === slot ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Button variant="gradient" size="lg" fullWidth onClick={handleBook} disabled={!service || !selectedDate || !selectedSlot || saving}>
        {saving ? 'Booking...' : 'Confirm Booking'}
      </Button>
    </motion.div>
  );
}