/**
 * QueueBook — ETA & live queue state service.
 *
 * The estimated waiting time is computed from the actual live queue rather
 * than a hardcoded value:
 *
 *   peopleAhead = every active (waiting / called) customer with a lower token
 *   workload     = sum of each person-ahead's service duration
 *                  (called customers only contribute their REMAINING time)
 *   activeStaff  = number of staff currently on duty & not on break
 *                  (never less than 1, so the formula is defined even when
 *                   a business has not configured staff)
 *   etaMinutes   = ceil(workload / activeStaff)
 *
 * Parallel service: with 2 staff serving simultaneously the workload is
 * divided across them, which models a real multi-chair salon instead of
 * assuming a single server.
 *
 * Fallbacks (never "unavailable" when the queue genuinely has data):
 *   - A customer's service duration comes from the business's service record.
 *   - If that is missing, business.avgServiceTime is used.
 *   - If that is missing, DEFAULT_SERVICE_DURATION (30 min) is used.
 */

const Queue = require('../models/Queue');
const Business = require('../models/Business');
const { getTodayRange, timeToMinutes } = require('../utils/helpers');

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const IST_DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DEFAULT_SERVICE_DURATION = 30;

function getNowIst() {
  const now = new Date();
  return {
    now,
    dayName: IST_DAY_NAMES[new Date(now.getTime() + IST_OFFSET_MS).getUTCDay()],
    nowMin: new Date(now.getTime() + IST_OFFSET_MS).getUTCHours() * 60 + new Date(now.getTime() + IST_OFFSET_MS).getUTCMinutes(),
  };
}

/**
 * Resolve the service duration (minutes) for a queue entry.
 * @param {object} business  lean Business doc (services array present)
 * @param {object|null} appointment populated appointment doc (or null for walk-ins)
 */
function serviceDurationFor(business, appointment) {
  const svc = appointment?.service
    ? (business.services || []).find(
        (s) => s && String(s.name).trim().toLowerCase() === String(appointment.service).trim().toLowerCase()
      )
    : null;
  if (svc && Number(svc.duration) > 0) return Number(svc.duration);
  if (business && Number(business.avgServiceTime) > 0) return Number(business.avgServiceTime);
  return DEFAULT_SERVICE_DURATION;
}

/**
 * Number of staff that can serve customers RIGHT NOW.
 * Only active staff whose current availability window includes now and who are
 * not on a break count as serving staff.
 */
function activeStaffCount(business) {
  if (!business || !Array.isArray(business.staff) || business.staff.length === 0) return 1;
  const { dayName, nowMin } = getNowIst();
  const serving = business.staff.filter((s) => {
    if (!s || s.isActive === false) return false;
    const day = s.availability && s.availability[dayName];
    if (!day || day.off) return false;
    const open = timeToMinutes(day.open);
    const close = timeToMinutes(day.close);
    if (open === null || close === null || close <= open) return false;
    if (nowMin < open || nowMin >= close) return false;
    const breakStart = timeToMinutes(day.breakStart);
    const breakEnd = timeToMinutes(day.breakEnd);
    if (breakStart !== null && breakEnd !== null && nowMin >= breakStart && nowMin < breakEnd) return false;
    return true;
  });
  return Math.max(1, serving.length);
}

/**
 * Snapshot ETA used to seed a new queue entry's estimatedWaitTime.
 * Unlike computeQueueState this only needs the business doc (service time +
 * staff), so it can run right after a token is issued. The live number is
 * always recomputed by computeQueueState on the next broadcast.
 */
function estimateWaitMinutes(peopleAhead, business) {
  let avg = business ? Number(business.avgServiceTime) : 0;
  if (!(avg > 0)) avg = DEFAULT_SERVICE_DURATION;
  const ahead = Math.max(0, Number(peopleAhead) || 0);
  return Math.ceil((ahead * avg) / Math.max(1, activeStaffCount(business)));
}

/**
 * Whether the business is open right now, based on today's openingHours.
 */
function businessIsOpen(business) {
  if (!business) return false;
  const { dayName, nowMin } = getNowIst();

  const hours = Array.isArray(business.openingHours) ? business.openingHours : [];
  const entry = hours.find((h) => h && String(h.day || '').trim().toLowerCase() === dayName);
  if (entry) {
    if (entry.closed) return false;
    const open = timeToMinutes(entry.open);
    const close = timeToMinutes(entry.close);
    if (open === null || close === null || close <= open) return false;
    return nowMin >= open && nowMin < close;
  }

  if (business.timeSlots && business.timeSlots.open) {
    const open = timeToMinutes(business.timeSlots.open);
    const close = timeToMinutes(business.timeSlots.close);
    if (open === null || close === null || close <= open) return false;
    return nowMin >= open && nowMin < close;
  }

  return false;
}

/**
 * Compute the full live-queue state for a business today.
 * Returns a snapshot used both by REST endpoints and Socket.IO broadcasts so
 * the business dashboard and every customer see the SAME numbers.
 */
async function computeQueueState(businessId) {
  const { start, end } = getTodayRange();

  const [business, rawEntries] = await Promise.all([
    Business.findById(businessId).lean(),
    Queue.find({
      business: businessId,
      queueDate: { $gte: start, $lte: end },
      status: { $in: ['waiting', 'called'] },
    })
      .populate('appointment', 'service timeSlot staffName expectedStartTime')
      .populate('user', 'name')
      .sort({ tokenNumber: 1 })
      .lean(),
  ]);

  const activeStaff = business ? activeStaffCount(business) : 1;
  const now = Date.now();
  const beingServed = rawEntries.filter((e) => e.status === 'called').length;
  const waitingCount = rawEntries.filter((e) => e.status === 'waiting').length;
  const currentToken = rawEntries.find((e) => e.status === 'called')?.tokenNumber || null;

  const queue = rawEntries.map((entry) => {
    const ahead = rawEntries.filter(
      (e) => e.tokenNumber < entry.tokenNumber && ['waiting', 'called'].includes(e.status)
    );

    let workload = 0;
    for (const a of ahead) {
      let dur = serviceDurationFor(business, a.appointment);
      if (a.status === 'called' && a.calledAt) {
        const elapsedMin = (now - new Date(a.calledAt).getTime()) / 60000;
        dur = Math.max(0, dur - elapsedMin);
      }
      workload += dur;
    }

    const peopleAhead = ahead.length;
    const etaMinutes = Math.ceil(workload / activeStaff);

    return {
      queueId: entry._id,
      userId: entry.user?._id || null,
      tokenNumber: entry.tokenNumber,
      status: entry.status,
      customerName: entry.user?.name || entry.walkInName || '',
      walkInName: entry.walkInName || '',
      service: entry.appointment?.service || null,
      staffName: entry.appointment?.staffName || '',
      timeSlot: entry.appointment?.timeSlot || null,
      position: peopleAhead + 1,
      peopleAhead,
      etaMinutes,
      estimatedWaitTime: etaMinutes,
      beingServedCount: beingServed,
      waitingCount,
      activeStaff,
      currentToken,
      calledAt: entry.calledAt || null,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  });

  return {
    businessId,
    isOpen: businessIsOpen(business),
    activeStaff,
    waiting: waitingCount,
    beingServed,
    currentToken,
    queue,
    computedAt: new Date().toISOString(),
  };
}

module.exports = {
  computeQueueState,
  serviceDurationFor,
  activeStaffCount,
  businessIsOpen,
  estimateWaitMinutes,
  DEFAULT_SERVICE_DURATION,
};
