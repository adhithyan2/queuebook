const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const getTodayRange = () => {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const start = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - IST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
};

const generateTokenNumber = async (Queue, businessId) => {
  const { start, end } = getTodayRange();
  const count = await Queue.countDocuments({
    business: businessId,
    queueDate: { $gte: start, $lte: end },
  });
  return count + 1;
};

const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Build the exact IST wall-clock instant for an appointment date + time slot.
 * The stored `date` is a calendar date (UTC midnight); `timeSlot` is "HH:MM".
 * Returns a JS Date representing that moment in IST.
 */
const appointmentDateTimeIST = (date, timeSlot) => {
  const ds = String(date || '').slice(0, 10).split('-');
  if (ds.length !== 3) return null;
  const [h, m] = String(timeSlot || '').split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return new Date(Date.UTC(Number(ds[0]), Number(ds[1]) - 1, Number(ds[2]), h, m, 0) - IST_OFFSET_MS);
};

const addMinutesToTime = (timeStr, minutes) => {
  const base = timeToMinutes(timeStr);
  if (base === null) return '';
  return minutesToTime(base + minutes);
};

const generateTimeSlots = (open, close, interval = 30) => {
  const openMin = timeToMinutes(open);
  const closeMin = timeToMinutes(close);
  if (openMin === null || closeMin === null || closeMin <= openMin) return [];
  const slots = [];
  for (let t = openMin; t < closeMin; t += interval) {
    slots.push(minutesToTime(t));
  }
  return slots;
};

const getNextAvailableSlot = (open, close, interval = 30, nowMin = null, bookedSlots = []) => {
  const slots = generateTimeSlots(open, close, interval);
  if (slots.length === 0) return null;
  const booked = new Set((bookedSlots || []).filter(Boolean).map((s) => String(s)));
  const cutoff = nowMin === null || nowMin === undefined ? -1 : nowMin;
  const future = slots.filter((s) => {
    const m = timeToMinutes(s);
    return m !== null && m > cutoff && !booked.has(s);
  });
  return future.length > 0 ? future[0] : null;
};

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
  getTodayRange,
  generateTokenNumber,
  timeToMinutes,
  minutesToTime,
  appointmentDateTimeIST,
  addMinutesToTime,
  generateTimeSlots,
  getNextAvailableSlot,
  escapeRegExp,
};
