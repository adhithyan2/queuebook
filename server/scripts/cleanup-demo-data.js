/**
 * DEVELOPMENT-ONLY cleanup script.
 *
 * Deletes every `QB Demo` business and all related records created by the
 * dev-seed scripts (dev-seed-compare.js / dev-seed-profile.js / dev-seed-crowd.js):
 *   - QB Demo businesses
 *   - their appointments, queues, reviews, notifications, message logs
 *   - demo user accounts (email starts with `qb-demo-`)
 *
 * Usage:
 *   node scripts/cleanup-demo-data.js          # delete demo records
 *   node scripts/cleanup-demo-data.js --dry    # show what would be deleted
 */

require('dotenv').config();
if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run demo cleanup in production.');
  process.exit(1);
}

const mongoose = require('mongoose');
const Business = require('../models/Business');
const User = require('../models/User');
const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const MessageLog = require('../models/MessageLog');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set. Exiting.');
  process.exit(1);
}

const DEMO_NAME_REGEX = /^QB Demo/i;
const DEMO_EMAIL_REGEX = /^qb-demo-/i;

const DRY_RUN = process.argv.includes('--dry');

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  console.log('[cleanup-demo-data] Connected to MongoDB.');

  const businesses = await Business.find({ name: DEMO_NAME_REGEX }).select('_id name');
  const businessIds = businesses.map((b) => b._id);
  console.log(`[cleanup-demo-data] Found ${businessIds.length} demo businesses:`);
  businesses.forEach((b) => console.log(`  - ${b.name} (${b._id})`));

  const demoUsers = await User.find({ email: DEMO_EMAIL_REGEX }).select('_id email');
  const demoUserIds = demoUsers.map((u) => u._id);
  console.log(`[cleanup-demo-data] Found ${demoUserIds.length} demo users:`);
  demoUsers.forEach((u) => console.log(`  - ${u.email} (${u._id})`));

  if (businessIds.length === 0 && demoUserIds.length === 0) {
    console.log('[cleanup-demo-data] Nothing to clean.');
    await mongoose.disconnect();
    return;
  }

  const plans = [];
  if (businessIds.length > 0) {
    plans.push(
      ['Appointment', () => Appointment.countDocuments({ business: { $in: businessIds } }), () => Appointment.deleteMany({ business: { $in: businessIds } })],
      ['Queue', () => Queue.countDocuments({ business: { $in: businessIds } }), () => Queue.deleteMany({ business: { $in: businessIds } })],
      ['Review', () => Review.countDocuments({ business: { $in: businessIds } }), () => Review.deleteMany({ business: { $in: businessIds } })],
      ['Notification (data.business)', () => Notification.countDocuments({ 'data.business': { $in: businessIds } }), () => Notification.deleteMany({ 'data.business': { $in: businessIds } })],
      ['MessageLog (business)', () => MessageLog.countDocuments({ business: { $in: businessIds } }), () => MessageLog.deleteMany({ business: { $in: businessIds } })],
      ['Business', () => Promise.resolve(businessIds.length), () => Business.deleteMany({ _id: { $in: businessIds } })],
    );
  }
  if (demoUserIds.length > 0) {
    plans.push(
      ['Notification (demo user)', () => Notification.countDocuments({ user: { $in: demoUserIds } }), () => Notification.deleteMany({ user: { $in: demoUserIds } })],
      ['MessageLog (demo user)', () => MessageLog.countDocuments({ user: { $in: demoUserIds } }), () => MessageLog.deleteMany({ user: { $in: demoUserIds } })],
      ['User', () => Promise.resolve(demoUserIds.length), () => User.deleteMany({ _id: { $in: demoUserIds } })],
    );
  }

  for (const [label, countFn, run] of plans) {
    const count = await countFn();
    console.log(`[cleanup-demo-data] ${DRY_RUN ? '[dry] would delete' : 'deleting'} ${count} ${label}`);
    if (!DRY_RUN) await run();
  }

  if (DRY_RUN) {
    console.log('[cleanup-demo-data] Dry run complete. Re-run without --dry to delete.');
  } else {
    console.log('[cleanup-demo-data] Done.');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[cleanup-demo-data] Error:', err.message);
  process.exit(1);
});
