/**
 * QueueBook Smart Timing — crowd analytics service.
 *
 * Real-data-first hourly crowd analytics, crowd levels, best-time-to-visit,
 * expected future queue and owner-facing analytics.
 *
 * Guarantees:
 *   - Only real queue / appointment history is used.
 *   - When a business has too little real history, results report
 *     `source: 'insufficient'` with a "Not enough data yet" state instead of
 *     fabricating patterns.
 *   - Estimates are deterministic and are NEVER presented as guaranteed.
 *   - Past time slots, closed days, closing time and staff/service
 *     availability are respected.
 */

const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const {
  getDateRange,
  getBusinessWindow,
  dayNameForDate,
} = require('./availabilityService');
const { getTodayRange, timeToMinutes, minutesToTime } = require('../utils/helpers');

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_LABELS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const WINDOW_DAYS = 30;
const MIN_REAL_RECORDS = 10;
const CACHE_TTL_MS = 10 * 60 * 1000;

const CROWD_LEVELS = {
  low: { key: 'low', label: 'Low' },
  medium: { key: 'medium', label: 'Medium' },
  high: { key: 'high', label: 'High' },
  very_high: { key: 'very_high', label: 'Very High' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayStr() {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function nowMinutes() {
  return new Date(Date.now() + IST_OFFSET_MS).getUTCHours() * 60 +
    new Date(Date.now() + IST_OFFSET_MS).getUTCMinutes();
}

function currentISTHour() {
  return new Date(Date.now() + IST_OFFSET_MS).getUTCHours();
}

function levelFromRatio(ratio) {
  if (ratio <= 0.3) return CROWD_LEVELS.low;
  if (ratio <= 0.6) return CROWD_LEVELS.medium;
  if (ratio <= 0.8) return CROWD_LEVELS.high;
  return CROWD_LEVELS.very_high;
}

function dayString(date) {
  if (!date) return '';
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function hourOfDate(date) {
  if (!date) return null;
  return new Date(date.getTime() + IST_OFFSET_MS).getUTCHours();
}

// ---------------------------------------------------------------------------
// Caching (short TTL — crowd patterns change slowly)
// ---------------------------------------------------------------------------

const profileCache = new Map();

function cached(key) {
  const entry = profileCache.get(key);
  if (entry && entry.expires > Date.now()) return entry.value;
  profileCache.delete(key);
  return null;
}

function cacheSet(key, value) {
  profileCache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

// ---------------------------------------------------------------------------
// Real history aggregation
// ---------------------------------------------------------------------------

async function countRealHistory(businessId) {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const appointments = await Appointment.countDocuments({
    business: businessId,
    date: { $gte: since },
    status: { $ne: 'cancelled' },
  });
  const queues = await Queue.countDocuments({
    business: businessId,
    queueDate: { $gte: since },
    status: { $ne: 'cancelled' },
  });
  return { total: appointments + queues, appointments, queues };
}

async function collectRealRows(businessId) {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const appointmentRows = await Appointment.find({
    business: businessId,
    date: { $gte: since },
    status: { $ne: 'cancelled' },
  })
    .select('date timeSlot status')
    .lean();

  const queueRows = await Queue.find({
    business: businessId,
    queueDate: { $gte: since },
    status: { $ne: 'cancelled' },
  })
    .select('queueDate calledAt completedAt createdAt')
    .lean();

  return { appointmentRows, queueRows };
}

function normalizeHourly(perHourTotals, daysCovered) {
  const hourly = new Array(24).fill(null);
  let maxPerHour = 0;
  for (let h = 0; h < 24; h += 1) {
    const total = perHourTotals[h] || 0;
    const count = Math.round((total / Math.max(1, daysCovered)) * 10) / 10;
    hourly[h] = { hour: h, count, relative: 0, level: CROWD_LEVELS.low.key, label: minutesToTime(h * 60) };
    if (count > maxPerHour) {
      maxPerHour = count;
    }
  }
  if (maxPerHour > 0) {
    for (let h = 0; h < 24; h += 1) {
      hourly[h].relative = Math.round((hourly[h].count / maxPerHour) * 100) / 100;
    }
  }
  for (let h = 0; h < 24; h += 1) {
    hourly[h].level = levelFromRatio(hourly[h].relative).key;
  }
  return { hourly, maxPerHour };
}

function emptyHourlyProfile() {
  const hourly = new Array(24).fill(null);
  for (let h = 0; h < 24; h += 1) {
    hourly[h] = { hour: h, count: 0, relative: 0, level: CROWD_LEVELS.low.key, label: minutesToTime(h * 60) };
  }
  return hourly;
}

/**
 * Build the 24-hour crowd profile for a business from real history only.
 * Result is cached briefly. Reports 'insufficient' when there is not enough
 * real history to be meaningful.
 */
async function buildHourlyProfile(business) {
  const key = `hourly:${String(business._id)}`;
  const hit = cached(key);
  if (hit) return hit;

  const history = await countRealHistory(business._id);

  if (history.total < MIN_REAL_RECORDS) {
    const profile = {
      source: 'insufficient',
      hasEnoughData: false,
      windowDays: WINDOW_DAYS,
      daysCovered: 0,
      totalRealRecords: history.total,
      hourly: emptyHourlyProfile(),
      maxPerHour: 0,
    };
    cacheSet(key, profile);
    return profile;
  }

  const { appointmentRows, queueRows } = await collectRealRows(business._id);
  const perHour = {};
  const days = new Set();

  for (const row of appointmentRows) {
    const day = dayString(row.date);
    const hour = row.timeSlot ? parseInt(String(row.timeSlot).split(':')[0], 10) : null;
    days.add(day);
    if (hour !== null && !Number.isNaN(hour) && hour >= 0 && hour < 24) {
      perHour[hour] = (perHour[hour] || 0) + 1;
    }
  }
  for (const row of queueRows) {
    days.add(dayString(row.queueDate));
    const ts = row.calledAt || row.completedAt || row.createdAt || row.queueDate;
    const hour = hourOfDate(ts);
    if (hour !== null && hour >= 0 && hour < 24) {
      perHour[hour] = (perHour[hour] || 0) + 1;
    }
  }

  const daysCovered = days.size;
  const normalized = normalizeHourly(perHour, daysCovered);
  const profile = {
    source: 'real',
    hasEnoughData: true,
    windowDays: WINDOW_DAYS,
    daysCovered,
    totalRealRecords: history.total,
    ...normalized,
  };
  cacheSet(key, profile);
  return profile;
}

/**
 * Weekday busy-ness profile (sunday..saturday). Real data only; reports
 * 'insufficient' when there is too little real history.
 */
async function buildDailyProfile(business) {
  const key = `daily:${String(business._id)}`;
  const hit = cached(key);
  if (hit) return hit;

  const history = await countRealHistory(business._id);

  if (history.total < MIN_REAL_RECORDS) {
    const daily = DAY_LABELS.map((day) => ({
      day,
      label: day.slice(0, 3),
      count: 0,
      relative: 0,
    }));
    const profile = { source: 'insufficient', hasEnoughData: false, daysCovered: 0, totalRealRecords: history.total, daily };
    cacheSet(key, profile);
    return profile;
  }

  const { appointmentRows, queueRows } = await collectRealRows(business._id);
  const perDay = {};
  const days = new Set();
  const countFor = (day, n) => {
    perDay[day] = (perDay[day] || 0) + n;
  };
  for (const row of appointmentRows) {
    const day = DAY_LABELS[new Date(row.date.getTime() + IST_OFFSET_MS).getUTCDay()];
    days.add(dayString(row.date));
    countFor(day, 1);
  }
  for (const row of queueRows) {
    const day = DAY_LABELS[new Date(row.queueDate.getTime() + IST_OFFSET_MS).getUTCDay()];
    days.add(dayString(row.queueDate));
    countFor(day, 1);
  }

  const daysCovered = days.size;
  const daily = DAY_LABELS.map((day, i) => {
    const avg = daysCovered > 0 ? (perDay[day] || 0) / daysCovered : 0;
    return {
      day,
      label: day.slice(0, 3),
      count: Math.round(avg * 10) / 10,
      relative: 0,
    };
  });
  const maxDay = Math.max(...daily.map((d) => d.count), 0);
  if (maxDay > 0) {
    for (const d of daily) d.relative = Math.round((d.count / maxDay) * 100) / 100;
  }
  const profile = { source: 'real', hasEnoughData: true, daysCovered, totalRealRecords: history.total, daily };
  cacheSet(key, profile);
  return profile;
}

function hoursOpenPerDay(business) {
  const hours = Array.isArray(business.openingHours) ? business.openingHours : [];
  const windows = hours.filter((h) => h && !h.closed && h.open && h.close);
  if (windows.length > 0) {
    const total = windows.reduce((sum, h) => {
      const o = timeToMinutes(h.open);
      const c = timeToMinutes(h.close);
      return sum + (o !== null && c !== null && c > o ? (c - o) / 60 : 0);
    }, 0);
    return total / windows.length;
  }
  const o = timeToMinutes(business.timeSlots?.open);
  const c = timeToMinutes(business.timeSlots?.close);
  return o !== null && c !== null && c > o ? (c - o) / 60 : null;
}

function countActiveStaffForHour(business, dayName, targetMin) {
  const staff = Array.isArray(business.staff) ? business.staff : [];
  return staff.filter((s) => {
    if (!s || s.isActive === false) return false;
    const d = s.availability ? s.availability[dayName] : null;
    if (!d || d.off) return false;
    const o = timeToMinutes(d.open);
    const c = timeToMinutes(d.close);
    return o !== null && c !== null && targetMin >= o && targetMin < c;
  }).length;
}

// ---------------------------------------------------------------------------
// Best time to visit
// ---------------------------------------------------------------------------

async function buildBestTimes(business) {
  const profile = await buildHourlyProfile(business);
  const hourCounts = profile.hourly;

  if (profile.source === 'insufficient') {
    return {
      source: 'insufficient',
      hasEnoughData: false,
      hasCandidates: false,
      best: [],
      avoid: [],
      candidates: [],
      message: 'Not enough data yet',
    };
  }

  const candidates = [];
  const nextDays = 7;
  for (let i = 0; i < nextDays; i += 1) {
    const date = new Date(Date.now() + (i * 24 * 60 * 60 * 1000));
    const dateStr = dayString(date);
    const dayName = dayNameForDate(dateStr);
    const window = getBusinessWindow(business, dateStr);
    if (!window || !dayName) continue;
    const labelDate = new Date(`${dateStr}T00:00:00.000Z`);

    const { start, end } = getDateRange(dateStr);
    const booked = await Appointment.find({
      business: business._id,
      date: { $gte: start, $lte: end },
      status: { $in: ['pending', 'confirmed'] },
    }).select('timeSlot').lean();
    const bookedCount = (slotStr) => booked.filter((a) => String(a.timeSlot) === slotStr).length;

    for (let t = window.openMin; t < window.closeMin; t += 60) {
      const hour = Math.floor(t / 60);
      const time = minutesToTime(t);
      if (i === 0 && t <= nowMinutes()) continue;

      const crowd = hourCounts[hour] || { relative: 0, level: CROWD_LEVELS.low.key, count: 0 };
      const staffCount = countActiveStaffForHour(business, dayName, t);
      const bookedAtHour = bookedCount(time);
      const score = Math.round(
        (crowd.relative || 0) * 100 + bookedAtHour * 10 - Math.max(0, staffCount) * 5
      );

      candidates.push({
        date: dateStr,
        dayLabel: labelDate.toLocaleDateString('en-US', { weekday: 'short' }),
        dateLabel: labelDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
        time,
        crowdLevel: crowd.level,
        crowdRelative: crowd.relative || 0,
        bookedCount: bookedAtHour,
        staffCount,
        score,
      });
    }
  }

  const sorted = [...candidates].sort((a, b) => a.score - b.score);
  return {
    source: profile.source,
    hasEnoughData: true,
    best: sorted.slice(0, 3),
    avoid: [...sorted].reverse().slice(0, 3),
    candidates,
    hasCandidates: candidates.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Expected queue
// ---------------------------------------------------------------------------

async function getExpectedQueue(business, { date, time, serviceId, staffId }) {
  const dateStr = String(date || '').slice(0, 10);
  const targetMin = timeToMinutes(time);
  if (!dateStr || targetMin === null) {
    return { status: 'invalid', message: 'Date and time are required' };
  }

  const isToday = dateStr === todayStr();
  const dayName = dayNameForDate(dateStr);
  if (!dayName) return { status: 'closed', message: 'Invalid date' };

  const window = getBusinessWindow(business, dateStr);
  if (!window) return { status: 'closed', message: 'This business is closed on this day' };
  if (targetMin < window.openMin || targetMin >= window.closeMin) {
    return { status: 'closed', message: 'This time is outside opening hours' };
  }
  if (isToday && targetMin <= nowMinutes()) {
    return { status: 'past', message: 'This time is in the past. Please pick a future time.' };
  }

  let staffList = Array.isArray(business.staff) ? business.staff : [];
  staffList = staffList.filter((s) => s && s.isActive !== false);
  if (staffId) {
    staffList = staffList.filter((s) => String(s._id) === String(staffId));
    if (staffList.length === 0) {
      return { status: 'closed', message: 'This professional is not available at this time' };
    }
  }
  const working = staffList.filter((s) => {
    const d = s.availability ? s.availability[dayName] : null;
    if (!d || d.off) return false;
    const o = timeToMinutes(d.open);
    const c = timeToMinutes(d.close);
    return o !== null && c !== null && targetMin >= o && targetMin < c;
  });
  const activeStaff = working.length;
  if (activeStaff === 0) {
    return { status: 'closed', message: 'No staff available at this time' };
  }

  const avgServiceTime = Number(business.avgServiceTime) > 0 ? Number(business.avgServiceTime) : null;
  let duration = avgServiceTime;
  if (serviceId) {
    const svc = (business.services || []).find(
      (s) => s && String(s._id) === String(serviceId)
    );
    if (svc && Number(svc.duration) > 0) duration = Number(svc.duration);
  }

  const { start, end } = getDateRange(dateStr);
  const timeStr = minutesToTime(targetMin);

  let remainingBacklog = 0;
  if (isToday) {
    const today = getTodayRange();
    const waiting = await Queue.countDocuments({
      business: business._id,
      queueDate: { $gte: today.start, $lte: today.end },
      status: 'waiting',
    });
    const called = await Queue.countDocuments({
      business: business._id,
      queueDate: { $gte: today.start, $lte: today.end },
      status: 'called',
    });
    if (avgServiceTime !== null) {
      const capacityBetween = Math.floor(Math.max(0, targetMin - nowMinutes()) / Math.max(1, avgServiceTime)) * activeStaff;
      remainingBacklog = Math.max(0, waiting + called - capacityBetween);
    } else {
      remainingBacklog = waiting + called;
    }
  }

  const bookedBefore = await Appointment.countDocuments({
    business: business._id,
    date: { $gte: start, $lte: end },
    timeSlot: { $lt: timeStr },
    status: { $in: ['pending', 'confirmed'] },
  });
  const completedBefore = await Appointment.countDocuments({
    business: business._id,
    date: { $gte: start, $lte: end },
    timeSlot: { $lt: timeStr },
    status: 'completed',
  });

  const unservedBooked = Math.max(0, bookedBefore - completedBefore);
  const expectedQueue = remainingBacklog + unservedBooked;
  const expectedWait = duration !== null
    ? Math.round((expectedQueue * duration) / Math.max(1, activeStaff))
    : null;

  const profile = await buildHourlyProfile(business);
  const hour = Math.floor(targetMin / 60);
  const hasCrowdData = profile.source !== 'insufficient';
  const crowd = !hasCrowdData
    ? { level: null, relative: null, count: null }
    : profile.hourly[hour] || { level: CROWD_LEVELS.low.key, relative: 0, count: 0 };

  return {
    status: 'ok',
    date: dateStr,
    time: timeStr,
    expectedQueue,
    expectedWait,
    duration,
    activeStaff,
    backlogRemaining: remainingBacklog,
    bookedBefore,
    staffId: staffId ? String(staffId) : null,
    crowdLevel: crowd.level,
    crowdRelative: crowd.relative || 0,
    dataSource: profile.source,
    isToday,
    message: expectedQueue > 0
      ? `Expected about ${expectedQueue} ahead of you at ${timeStr}.`
      : `Likely a quiet time — expected queue is empty at ${timeStr}.`,
  };
}

// ---------------------------------------------------------------------------
// Crowd analytics (owner-facing summary + customer-facing summary)
// ---------------------------------------------------------------------------

async function getCrowdAnalytics(business) {
  const profile = await buildHourlyProfile(business);
  const dailyProfile = await buildDailyProfile(business);

  if (profile.source === 'insufficient') {
    return {
      source: 'insufficient',
      hasEnoughData: false,
      message: 'Not enough data yet',
      windowDays: WINDOW_DAYS,
      daysCovered: 0,
      totalRealRecords: profile.totalRealRecords,
      hourly: profile.hourly,
      daily: dailyProfile.daily,
      peakHour: null,
      lowestHour: null,
      busiestDay: null,
      leastBusyDay: null,
      avgDailyCustomers: null,
      avgQueueSize: null,
      avgWait: null,
    };
  }

  const activeHours = profile.hourly.filter((h) => h && h.relative > 0);
  const sortedByLevel = [...activeHours].sort((a, b) => b.relative - a.relative);
  const peakHour = sortedByLevel.length > 0
    ? sortedByLevel[0]
    : profile.hourly[12] || { hour: 12, label: '12:00', relative: 0, level: 'low' };

  const realActive = activeHours.filter((h) => h.relative > 0);
  const lowestHour = realActive.length > 0
    ? [...realActive].sort((a, b) => a.relative - b.relative)[0]
    : null;

  const dailySorted = [...dailyProfile.daily].sort((a, b) => b.count - a.count);
  const busiestDay = dailySorted[0] || { day: 'monday', label: 'Mon', count: 0 };
  const leastBusyDay = [...dailyProfile.daily].sort((a, b) => a.count - b.count)[0] || busiestDay;

  const avgDailyCustomers = Math.max(1, Math.round(profile.totalRealRecords / Math.max(1, profile.daysCovered)));

  const openHours = hoursOpenPerDay(business);
  const avgServiceTime = Number(business.avgServiceTime) > 0 ? Number(business.avgServiceTime) : null;
  const avgQueueSize = openHours !== null && openHours > 0 && avgServiceTime !== null
    ? Math.max(1, Math.round((avgDailyCustomers / openHours) * (avgServiceTime / 60)))
    : null;
  const avgWait = avgQueueSize !== null && avgServiceTime !== null ? Math.round(avgQueueSize * avgServiceTime) : null;

  return {
    source: profile.source,
    hasEnoughData: true,
    windowDays: WINDOW_DAYS,
    daysCovered: profile.daysCovered,
    totalRealRecords: profile.totalRealRecords,
    hourly: profile.hourly,
    daily: dailyProfile.daily,
    peakHour: { hour: peakHour.hour, label: peakHour.label, level: peakHour.level, relative: peakHour.relative },
    lowestHour: lowestHour
      ? { hour: lowestHour.hour, label: lowestHour.label, level: lowestHour.level, relative: lowestHour.relative }
      : null,
    busiestDay: { day: busiestDay.day, label: busiestDay.label, count: busiestDay.count },
    leastBusyDay: { day: leastBusyDay.day, label: leastBusyDay.label, count: leastBusyDay.count },
    avgDailyCustomers,
    avgQueueSize,
    avgWait,
  };
}

/**
 * Lightweight snapshot for list/card surfaces (e.g. Explore page): current
 * crowd level + today's best remaining time.
 */
async function getCrowdSnapshot(business) {
  const profile = await buildHourlyProfile(business);

  if (profile.source === 'insufficient') {
    return {
      source: 'insufficient',
      hasEnoughData: false,
      currentHour: currentISTHour(),
      currentCrowdLevel: null,
      currentCrowdRelative: null,
      peakHourLabel: null,
      bestTimeToday: null,
      bestTimeNext: null,
    };
  }

  const hour = currentISTHour();
  const entry = profile.hourly[hour] || { level: CROWD_LEVELS.low.key, relative: 0, count: 0 };

  const bestTimes = await buildBestTimes(business);
  const todayBest = bestTimes.best.find((c) => c.date === todayStr()) || null;
  const nextBest = bestTimes.best[0] || null;

  return {
    source: profile.source,
    hasEnoughData: true,
    currentHour: hour,
    currentCrowdLevel: entry.level,
    currentCrowdRelative: entry.relative || 0,
    peakHourLabel: profile.hourly.reduce((max, h) => (h.relative > (max?.relative || 0) ? h : max), null)?.label || null,
    bestTimeToday: todayBest
      ? { time: todayBest.time, crowdLevel: todayBest.crowdLevel }
      : null,
    bestTimeNext: nextBest
      ? { date: nextBest.date, dateLabel: nextBest.dateLabel, time: nextBest.time, crowdLevel: nextBest.crowdLevel }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  CROWD_LEVELS,
  MIN_REAL_RECORDS,
  WINDOW_DAYS,
  buildHourlyProfile,
  buildDailyProfile,
  buildBestTimes,
  getExpectedQueue,
  getCrowdAnalytics,
  getCrowdSnapshot,
};
