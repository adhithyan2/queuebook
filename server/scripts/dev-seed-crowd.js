/**
 * DEVELOPMENT-ONLY seed script for QueueBook Smart Timing (PHASE 3).
 *
 * Creates labelled historical queue + appointment records for the demo
 * business "QB Demo · Fresh Cuts Salon" so the REAL-DATA crowd analytics
 * path can be exercised, plus a demo customer account.
 *
 * This script ONLY ADDS data and never modifies existing records.
 * It is fully removable: `--clean` deletes every record it created.
 *
 * Usage:
 *   node scripts/dev-seed-crowd.js          # seed demo history + demo customer
 *   node scripts/dev-seed-crowd.js --clean  # remove demo history + demo customer
 */

require('dotenv').config();
if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run dev seed in production.');
  process.exit(1);
}
const mongoose = require('mongoose');
const Business = require('../models/Business');
const User = require('../models/User');
const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');

const DEMO_BUSINESS_NAME = 'QB Demo · Fresh Cuts Salon';
const DEMO_PASSWORD = 'DemoPass123!';
const CUSTOMER_EMAIL = 'qb-demo-crowd-customer@queuebook.demo';
const WALK_IN_TAG = 'QB Demo Walk-in';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const HISTORY_DAYS = 30;
const WEEKDAY_WEIGHT = [1.4, 0.8, 0.9, 0.9, 1.0, 1.1, 1.5]; // sun..sat

function mulberry32(a) {
  return function next() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function istMidnight(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
}

function istDateString(date) {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const clean = process.argv.includes('--clean');

  const business = await Business.findOne({ name: DEMO_BUSINESS_NAME });
  if (!business && !clean) {
    console.log('[dev-seed-crowd] Demo business not found. Run "node scripts/dev-seed-profile.js" first.');
    await mongoose.disconnect();
    process.exit(0);
  }

  if (clean) {
    const removedQueues = await Queue.deleteMany({ walkInName: WALK_IN_TAG });
    const customer = await User.findOne({ email: CUSTOMER_EMAIL });
    const removedAppointments = customer
      ? await Appointment.deleteMany({ user: customer._id })
      : { deletedCount: 0 };
    const removedUsers = await User.deleteMany({ email: CUSTOMER_EMAIL });
    console.log(`[dev-seed-crowd] Cleaned ${removedQueues.deletedCount} demo queue record(s), ${removedAppointments.deletedCount} demo appointment(s) and ${removedUsers.deletedCount} demo user(s).`);
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  const existing = await Queue.findOne({ walkInName: WALK_IN_TAG });
  if (existing) {
    console.log('[dev-seed-crowd] Skipping (demo history already exists). Use --clean to reset.');
    await mongoose.disconnect();
    process.exit(0);
  }

  let customer = await User.findOne({ email: CUSTOMER_EMAIL });
  if (!customer) {
    customer = await User.create({
      name: 'QB Demo Customer',
      email: CUSTOMER_EMAIL,
      password: DEMO_PASSWORD,
      role: 'customer',
      isActive: true,
    });
  }

  const serviceNames = (business.services || []).map((s) => s.name);
  const avgServiceTime = business.avgServiceTime || 8;
  const openHour = 9; // 09:00
  const closeHour = 20; // 20:00

  // Build per-day record lists first (deterministic pseudo-random but rich).
  const days = [];
  for (let i = HISTORY_DAYS; i >= 1; i -= 1) {
    const dayDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    days.push({ dateStr: istDateString(dayDate) });
  }
  // Add today as well (so today's analytics include a few entries).
  days.push({ dateStr: istDateString(new Date()) });

  let tokenGlobal = 0;
  const queueDocs = [];
  const appointmentDocs = [];

  for (const { dateStr } of days) {
    const dayDate = new Date(`${dateStr}T00:00:00.000Z`);
    const weekday = DAY_KEYS[dayDate.getUTCDay()];
    const weight = WEEKDAY_WEIGHT[dayDate.getUTCDay()] || 1;
    const rand = mulberry32(tokenGlobal * 7919 + dayDate.getUTCDay());
    const dailyCount = Math.round((20 + rand() * 25) * weight);

    const dayStart = istMidnight(dateStr);
    const isToday = dateStr === istDateString(new Date());

    for (let k = 0; k < dailyCount; k += 1) {
      tokenGlobal += 1;
      // Weight toward peak hours (11:00-13:00 and 16:00-20:00).
      const r = rand();
      let hour;
      if (r < 0.25) hour = openHour + Math.floor(rand() * 3); // 9-11
      else if (r < 0.55) hour = 11 + Math.floor(rand() * 3); // 11-13
      else hour = 16 + Math.floor(rand() * 4); // 16-19
      const minute = rand() < 0.5 ? 0 : 30;
      const servedAt = new Date(dayStart.getTime() + (hour * 60 + minute) * 60000);

      // Past days are fully served; today's entries are mostly still active.
      let status = 'completed';
      let calledAt = servedAt;
      let completedAt = new Date(servedAt.getTime() + avgServiceTime * 60000);
      if (isToday && k < Math.max(1, Math.round(dailyCount / 2))) {
        status = k % 5 === 0 ? 'called' : 'waiting';
        calledAt = undefined;
        completedAt = undefined;
      } else if (isToday && k >= Math.round(dailyCount / 2)) {
        status = 'completed';
      } else if (rand() < 0.08) {
        status = 'skipped';
        completedAt = undefined;
      }

      queueDocs.push({
        business: business._id,
        user: status === 'waiting' || status === 'called' ? customer._id : undefined,
        walkInName: WALK_IN_TAG,
        tokenNumber: tokenGlobal,
        queueDate: dayStart,
        status,
        position: k + 1,
        estimatedWaitTime: k * avgServiceTime,
        calledAt,
        completedAt,
      });
    }

    // Historical confirmed appointments (a subset of days) for booking history.
    if (!isToday && rand() < 0.6) {
      const apptCount = 2 + Math.floor(rand() * 4);
      for (let a = 0; a < apptCount; a += 1) {
        const h = 10 + Math.floor(rand() * 9);
        const m = rand() < 0.5 ? 0 : 30;
        appointmentDocs.push({
          user: customer._id,
          business: business._id,
          service: serviceNames[Math.floor(rand() * serviceNames.length)] || 'Haircut',
          date: dayDate,
          timeSlot: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
          status: 'completed',
          paymentStatus: 'not_required',
          advanceAmount: 0,
        });
      }
    }
  }

  // A few today appointments (before now) so expected-queue has real bookings.
  const now = new Date(Date.now() + IST_OFFSET_MS);
  const todayStr2 = istDateString(now);
  const todayMidnight = istMidnight(todayStr2);
  const nowHour = now.getUTCHours();
  const bookedSlots = [];
  for (let h = Math.max(openHour, nowHour - 3); h < nowHour; h += 1) {
    bookedSlots.push(`${String(h).padStart(2, '0')}:30`);
  }
  for (const slot of bookedSlots) {
    appointmentDocs.push({
      user: customer._id,
      business: business._id,
      service: serviceNames[0] || 'Haircut',
      date: todayMidnight,
      timeSlot: slot,
      status: 'confirmed',
      paymentStatus: 'not_required',
      advanceAmount: 0,
    });
  }

  // A few future confirmed appointments (next 3 days, morning slots) so the
  // expected-queue / best-times endpoints have a real booked load to model.
  for (let d = 1; d <= 3; d += 1) {
    const futureDay = istMidnight(istDateString(new Date(Date.now() + d * 24 * 60 * 60 * 1000)));
    for (let h = 10; h <= 12; h += 1) {
      appointmentDocs.push({
        user: customer._id,
        business: business._id,
        service: serviceNames[0] || 'Haircut',
        date: futureDay,
        timeSlot: `${String(h).padStart(2, '0')}:30`,
        status: 'confirmed',
        paymentStatus: 'not_required',
        advanceAmount: 0,
      });
    }
  }

  await Queue.insertMany(queueDocs);
  await Appointment.insertMany(appointmentDocs);

  console.log(`[dev-seed-crowd] Created ${queueDocs.length} queue record(s) and ${appointmentDocs.length} appointment(s) for ${business.name}`);
  console.log(`[dev-seed-crowd] Demo customer: ${CUSTOMER_EMAIL} / ${DEMO_PASSWORD}`);
  console.log('[dev-seed-crowd] Done. This script is DEVELOPMENT-ONLY.');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('[dev-seed-crowd] Failed:', err.message);
  process.exit(1);
});
