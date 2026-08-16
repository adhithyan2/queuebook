/**
 * DEVELOPMENT-ONLY seed script for the Service Comparison + Smart
 * Recommendation feature (PHASE 1).
 *
 * This script ONLY ADDS data. It never modifies or deletes existing
 * businesses, users, queues or appointments.
 *
 * It creates a few clearly-labelled demo businesses (with real price /
 * duration / availability data) so the comparison feature can be tested
 * with meaningful data.
 *
 * Usage:
 *   node scripts/dev-seed-compare.js          # seed demo businesses
 *   node scripts/dev-seed-compare.js --clean  # remove demo businesses + demo users
 */

require('dotenv').config();
if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run dev seed in production.');
  process.exit(1);
}
const mongoose = require('mongoose');
const Business = require('../models/Business');
const User = require('../models/User');
const Review = require('../models/Review');

const DEMO_TAG = 'QB Demo';
const DEMO_PASSWORD = 'DemoPass123!';

const DEMO_REVIEWS = {
  'QB Demo · Cuts & Curls': [{ rating: 4, comment: 'Quick service, friendly staff.' }, { rating: 4, comment: 'Good haircut.' }, { rating: 3, comment: 'Average experience.' }],
  'QB Demo · StylePoint Salon': [{ rating: 5, comment: 'Best haircut in town!' }, { rating: 5, comment: 'Great pricing and fast.' }, { rating: 4, comment: 'Very professional.' }],
  'QB Demo · Glow Beauty Lounge': [{ rating: 4, comment: 'Nice ambience.' }, { rating: 3, comment: 'Had to wait a while.' }],
};

const DEMO_BUSINESSES = [
  {
    name: 'QB Demo · Cuts & Curls',
    category: 'salon',
    address: '100 Feet Road, Coimbatore',
    avgServiceTime: 8,
    location: { type: 'Point', coordinates: [77.04, 11.02] },
    services: [
      { name: 'Haircut', price: 200, duration: 30, isAvailable: true },
      { name: 'Shave', price: 100, duration: 15, isAvailable: true },
      { name: 'Facial', price: 400, duration: 40, isAvailable: true },
    ],
  },
  {
    name: 'QB Demo · StylePoint Salon',
    category: 'salon',
    address: 'RS Puram, Coimbatore',
    avgServiceTime: 5,
    location: { type: 'Point', coordinates: [77.06, 11.05] },
    services: [
      { name: 'Haircut', price: 150, duration: 30, isAvailable: true },
      { name: 'Hair Coloring', price: 800, duration: 90, isAvailable: true },
      { name: 'Facial', price: 350, duration: 40, isAvailable: true },
    ],
  },
  {
    name: 'QB Demo · Glow Beauty Lounge',
    category: 'salon',
    address: 'Gandhipuram, Coimbatore',
    avgServiceTime: 12,
    location: { type: 'Point', coordinates: [77.02, 11.03] },
    services: [
      { name: 'Haircut', price: 250, duration: 45, isAvailable: true },
      { name: 'Hair Coloring', price: 950, duration: 120, isAvailable: true },
      { name: 'Facial', price: 500, duration: 45, isAvailable: true },
    ],
  },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const clean = process.argv.includes('--clean');

  if (clean) {
    const removedReviews = await Review.deleteMany({ 'business': { $in: (await Business.find({ name: { $regex: `^${DEMO_TAG} ` } }).select('_id').lean()).map((b) => b._id) } });
    const removedBusinesses = await Business.deleteMany({ name: { $regex: `^${DEMO_TAG} ` } });
    const removedUsers = await User.deleteMany({ email: { $regex: '^qb-demo-' } });
    console.log(`[dev-seed] Cleaned ${removedBusinesses.deletedCount} demo business(es), ${removedReviews.deletedCount} demo review(s) and ${removedUsers.deletedCount} demo user(s).`);
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  for (const demo of DEMO_BUSINESSES) {
    const existing = await Business.findOne({ name: demo.name });
    if (existing) {
      console.log(`[dev-seed] Skipping (already exists): ${demo.name}`);
      continue;
    }
    const email = `qb-demo-${demo.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}@queuebook.demo`;
    let owner = await User.findOne({ email });
    if (!owner) {
      owner = await User.create({
        name: demo.name.replace('QB Demo · ', '') + ' (Demo Owner)',
        email,
        password: DEMO_PASSWORD,
        role: 'business',
        isActive: true,
      });
    }
    const business = await Business.create({
      owner: owner._id,
      name: demo.name,
      description: `Development demo business for testing service comparison. ${demo.name}.`,
      category: demo.category,
      address: demo.address,
      location: demo.location,
      phone: '+91 00000 00000',
      email,
      services: demo.services,
      timeSlots: { open: '09:00', close: '21:00', interval: 30 },
      avgServiceTime: demo.avgServiceTime,
      rating: 0,
      approvalStatus: 'approved',
      isActive: true,
    });
    console.log(`[dev-seed] Created: ${business.name} (owner ${owner.email})`);
  }

  // Demo reviews (idempotent) — development-only ratings for the demo businesses.
  // The Review model enforces one review per user per business, so each demo
  // review uses its own demo reviewer account.
  const demoReviewerEmails = [];
  for (const [name, reviews] of Object.entries(DEMO_REVIEWS)) {
    const biz = await Business.findOne({ name });
    if (!biz) continue;
    for (let i = 0; i < reviews.length; i += 1) {
      demoReviewerEmails.push(`qb-demo-rv-${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}-${i}@queuebook.demo`);
    }
  }
  const demoReviewerIds = [];
  for (const email of demoReviewerEmails) {
    let u = await User.findOne({ email });
    if (!u) {
      u = await User.create({
        name: 'QB Demo Reviewer',
        email,
        password: DEMO_PASSWORD,
        role: 'customer',
        isActive: true,
      });
    }
    demoReviewerIds.push(u._id);
  }

  for (const [name, reviews] of Object.entries(DEMO_REVIEWS)) {
    const biz = await Business.findOne({ name });
    if (!biz) continue;
    await Review.deleteMany({ business: biz._id, user: { $in: demoReviewerIds } });
    let reviewerIndex = 0;
    for (const r of reviews) {
      const reviewer = await User.findOne({
        email: `qb-demo-rv-${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}-${reviewerIndex}@queuebook.demo`,
      });
      if (!reviewer) continue;
      await Review.create({ user: reviewer._id, business: biz._id, rating: r.rating, comment: r.comment });
      reviewerIndex += 1;
    }
    console.log(`[dev-seed] Added ${reviews.length} demo review(s) to: ${name}`);
  }

  await mongoose.disconnect();
  console.log('[dev-seed] Done. This script is DEVELOPMENT-ONLY.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[dev-seed] Failed:', err.message);
  process.exit(1);
});
