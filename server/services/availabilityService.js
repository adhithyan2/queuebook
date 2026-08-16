const Appointment = require('../models/Appointment');
const { timeToMinutes, minutesToTime } = require('../utils/helpers');

const DAY_INDEX_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getDateRange(dateStr) {
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);
  return { start, end };
}

function isToday(dateStr) {
  const ist = new Date(Date.now() + IST_OFFSET_MS);
  const key = `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(ist.getUTCDate()).padStart(2, '0')}`;
  return String(dateStr || '').slice(0, 10) === key;
}

function dayNameForDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return DAY_INDEX_NAMES[date.getUTCDay()];
}

function normalizeDay(value) {
  if (!value) return null;
  return String(value).trim().toLowerCase();
}

function getBusinessWindow(business, dateStr) {
  const dayName = dayNameForDate(dateStr);
  if (!dayName) return null;

  const hours = Array.isArray(business.openingHours) ? business.openingHours : [];
  const entry = hours.find((h) => h && normalizeDay(h.day) === dayName);

  if (entry) {
    if (entry.closed) return null;
    const openMin = timeToMinutes(entry.open);
    const closeMin = timeToMinutes(entry.close);
    if (openMin === null || closeMin === null || closeMin <= openMin) return null;
    return { openMin, closeMin };
  }

  if (business.timeSlots && business.timeSlots.open) {
    const openMin = timeToMinutes(business.timeSlots.open);
    const closeMin = timeToMinutes(business.timeSlots.close);
    if (openMin === null || closeMin === null || closeMin <= openMin) return null;
    return { openMin, closeMin };
  }

  return null;
}

function getStaffWindow(staffDoc, dateStr) {
  if (!staffDoc) return undefined;
  const dayName = dayNameForDate(dateStr);
  if (!dayName) return undefined;
  const availability = staffDoc.availability || {};
  const day = availability[dayName];
  if (!day || day.off) return null;
  const openMin = timeToMinutes(day.open);
  const closeMin = timeToMinutes(day.close);
  if (openMin === null || closeMin === null || closeMin <= openMin) {
    return undefined;
  }
  return { openMin, closeMin };
}

function intersectWindows(a, b) {
  if (!a) return b;
  if (!b) return a;
  const openMin = Math.max(a.openMin, b.openMin);
  const closeMin = Math.min(a.closeMin, b.closeMin);
  if (closeMin <= openMin) return null;
  return { openMin, closeMin };
}

const DEFAULT_SERVICE_DURATION = 30;

async function getBookedRanges(businessId, dateStr, staffId, businessDoc) {
  const { start, end } = getDateRange(dateStr);
  const match = {
    business: businessId,
    date: { $gte: start, $lte: end },
    status: { $in: ['pending', 'confirmed', 'scheduled'] },
  };
  if (staffId) match.staff = staffId;
  const rows = await Appointment.find(match).select('timeSlot service').lean();
  return rows
    .map((r) => {
      const startMin = timeToMinutes(r.timeSlot);
      if (startMin === null) return null;
      const svc = (businessDoc?.services || []).find(
        (s) => s && String(s.name).trim().toLowerCase() === String(r.service || '').trim().toLowerCase()
      );
      const duration = svc && Number(svc.duration) > 0 ? Number(svc.duration) : DEFAULT_SERVICE_DURATION;
      return { start: startMin, end: startMin + duration };
    })
    .filter(Boolean);
}

function rangesOverlap(a, b) {
  return a.start < b.end && b.start < a.end;
}

function inBreak(staffDoc, dateStr, min) {
  if (!staffDoc) return false;
  const dayName = dayNameForDate(dateStr);
  const day = staffDoc.availability?.[dayName];
  if (!day) return false;
  const breakStart = day.breakStart ? timeToMinutes(day.breakStart) : null;
  const breakEnd = day.breakEnd ? timeToMinutes(day.breakEnd) : null;
  if (breakStart === null || breakEnd === null) return false;
  return min >= breakStart && min < breakEnd;
}

async function getAvailableSlots(business, dateStr, staffDoc, opts = {}) {
  const duration = opts.serviceDuration && Number(opts.serviceDuration) > 0
    ? Number(opts.serviceDuration)
    : DEFAULT_SERVICE_DURATION;

  if (staffDoc && staffDoc.isActive === false) return [];

  const businessWindow = getBusinessWindow(business, dateStr);
  const staffWindow = getStaffWindow(staffDoc, dateStr);
  if (staffWindow === null) return [];
  const window = staffDoc ? intersectWindows(businessWindow, staffWindow) : businessWindow;
  if (!window) return [];

  const interval = business.timeSlots?.interval || 30;
  const slots = [];
  for (let t = window.openMin; t < window.closeMin; t += interval) {
    slots.push(minutesToTime(t));
  }

  const booked = await getBookedRanges(business._id, dateStr, staffDoc ? staffDoc._id : null, business);
  const ist = new Date(Date.now() + IST_OFFSET_MS);
  const nowMin = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const today = isToday(dateStr);

  return slots.filter((s) => {
    const m = timeToMinutes(s);
    if (m === null) return false;
    if (inBreak(staffDoc, dateStr, m)) return false;
    if (today && m <= nowMin) return false;
    const range = { start: m, end: m + duration };
    if (booked.some((b) => rangesOverlap(b, range))) return false;
    return true;
  });
}

async function isSlotAvailable(business, dateStr, timeSlot, staffDoc, opts = {}) {
  if (!business) return { ok: false, message: 'Business not found' };
  if (!business.isActive || business.approvalStatus !== 'approved') {
    return { ok: false, message: 'This business is not accepting bookings right now' };
  }
  if (business.businessStatus && business.businessStatus !== 'active') {
    return { ok: false, message: 'This business is temporarily closed for bookings' };
  }

  const slots = await getAvailableSlots(business, dateStr, staffDoc, opts);
  if (!slots.includes(String(timeSlot))) {
    return { ok: false, message: 'This time slot is no longer available. Please pick another.' };
  }
  return { ok: true };
}

async function isStaffFreeAtSlot(business, staffDoc, dateStr, timeSlot, duration) {
  if (!staffDoc || staffDoc.isActive === false) return false;

  const dayName = dayNameForDate(dateStr);
  const availability = staffDoc.availability || {};
  const day = availability[dayName];
  if (!day || day.off) return false;

  const startMin = timeToMinutes(timeSlot);
  if (startMin === null) return false;
  const openMin = timeToMinutes(day.open);
  const closeMin = timeToMinutes(day.close);
  if (openMin === null || closeMin === null || closeMin <= openMin) return false;
  if (startMin < openMin || startMin + duration > closeMin) return false;
  if (inBreak(staffDoc, dateStr, startMin)) return false;

  const booked = await getBookedRanges(business._id, dateStr, staffDoc._id, business);
  const range = { start: startMin, end: startMin + duration };
  return !booked.some((b) => rangesOverlap(b, range));
}

async function pickAvailableStaff(business, dateStr, timeSlot, opts = {}) {
  const duration = opts.serviceDuration && Number(opts.serviceDuration) > 0
    ? Number(opts.serviceDuration)
    : DEFAULT_SERVICE_DURATION;
  const serviceId = opts.serviceId ? String(opts.serviceId) : null;

  const candidates = (business.staff || []).filter((s) => {
    if (!s || s.isActive === false) return false;
    if (!serviceId) return true;
    const assigned = (s.services || []).map((id) => String(id));
    return assigned.includes(serviceId);
  });

  const results = [];
  for (const s of candidates) {
    if (await isStaffFreeAtSlot(business, s, dateStr, timeSlot, duration)) {
      const { start, end } = getDateRange(dateStr);
      const todayCount = await Appointment.countDocuments({
        business: business._id,
        staff: s._id,
        date: { $gte: start, $lte: end },
        status: { $in: ['pending', 'confirmed', 'scheduled'] },
      });
      results.push({ staff: s, todayCount });
    }
  }

  if (results.length === 0) return null;
  results.sort((a, b) => a.todayCount - b.todayCount || a.staff.name.localeCompare(b.staff.name));
  return results[0].staff;
}

module.exports = {
  getDateRange,
  getAvailableSlots,
  isSlotAvailable,
  getBusinessWindow,
  getStaffWindow,
  dayNameForDate,
  pickAvailableStaff,
};
