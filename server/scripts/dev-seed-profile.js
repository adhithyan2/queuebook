/**
 * DEVELOPMENT-ONLY seed script for the Business Profile feature (PHASE 2).
 *
 * Creates a clearly-labelled demo business with a COMPLETE profile:
 * services (price/duration/description), staff with weekly availability,
 * opening hours, location, payment settings and business status.
 *
 * This script ONLY ADDS data and never touches existing records.
 *
 * Usage:
 *   node scripts/dev-seed-profile.js          # seed demo business + owner
 *   node scripts/dev-seed-profile.js --clean  # remove demo business + demo users
 */

require('dotenv').config();
if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run dev seed in production.');
  process.exit(1);
}
const mongoose = require('mongoose');
const Business = require('../models/Business');
const User = require('../models/User');

const DEMO_TAG = 'QB Demo';
const DEMO_PASSWORD = 'DemoPass123!';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const STAFF_TEMPLATE = [
  {
    name: 'Arun',
    role: 'Senior Stylist',
    phone: '+91 90000 11111',
    services: ['Haircut', 'Beard Trim'],
    availability: {
      monday: { open: '09:00', close: '18:00', off: false },
      tuesday: { open: '09:00', close: '18:00', off: false },
      wednesday: { open: '09:00', close: '18:00', off: false },
      thursday: { open: '09:00', close: '18:00', off: false },
      friday: { open: '09:00', close: '18:00', off: false },
      saturday: { open: '09:00', close: '15:00', off: false },
      sunday: { open: '', close: '', off: true },
    },
  },
  {
    name: 'Kumar',
    role: 'Stylist',
    phone: '+91 90000 22222',
    services: ['Haircut', 'Facial'],
    availability: {
      monday: { open: '11:00', close: '20:00', off: false },
      tuesday: { open: '11:00', close: '20:00', off: false },
      wednesday: { open: '11:00', close: '20:00', off: false },
      thursday: { open: '11:00', close: '20:00', off: false },
      friday: { open: '11:00', close: '20:00', off: false },
      saturday: { open: '10:00', close: '20:00', off: false },
      sunday: { open: '', close: '', off: true },
    },
  },
  {
    name: 'Suresh',
    role: 'Colorist',
    phone: '+91 90000 33333',
    services: ['Hair Coloring', 'Facial'],
    availability: {
      monday: { open: '10:00', close: '19:00', off: false },
      tuesday: { open: '10:00', close: '19:00', off: false },
      wednesday: { open: '10:00', close: '19:00', off: false },
      thursday: { open: '10:00', close: '19:00', off: false },
      friday: { open: '10:00', close: '19:00', off: false },
      saturday: { open: '09:00', close: '17:00', off: false },
      sunday: { open: '10:00', close: '14:00', off: false },
    },
  },
];

const DEMO_BUSINESS = {
  name: `${DEMO_TAG} · Fresh Cuts Salon`,
  description: 'A modern unisex salon offering haircuts, beard grooming, colouring and facials with a friendly experienced team.',
  category: 'salon',
  subcategory: 'unisex salon',
  address: '14, Cross Cut Road, RS Puram, Coimbatore',
  city: 'Coimbatore',
  state: 'Tamil Nadu',
  pincode: '641002',
  website: 'https://freshcuts.example.com',
  phone: '+91 90000 00001',
  location: { type: 'Point', coordinates: [76.9558, 11.0168] },
  avgServiceTime: 8,
  services: [
    { name: 'Haircut', price: 150, duration: 30, isAvailable: true, description: 'Classic scissors or machine haircut with styling.' },
    { name: 'Beard Trim', price: 100, duration: 20, isAvailable: true, description: 'Beard shaping and trim with hot towel finish.' },
    { name: 'Hair Coloring', price: 600, duration: 60, isAvailable: true, description: 'Full head colour with premium ammonia-free dye.' },
    { name: 'Facial', price: 300, duration: 45, isAvailable: true, description: 'Cleansing, exfoliation and massage facial.' },
  ],
  openingHours: [
    { day: 'Monday', open: '09:00', close: '20:00', closed: false },
    { day: 'Tuesday', open: '09:00', close: '20:00', closed: false },
    { day: 'Wednesday', open: '09:00', close: '20:00', closed: false },
    { day: 'Thursday', open: '09:00', close: '20:00', closed: false },
    { day: 'Friday', open: '09:00', close: '20:00', closed: false },
    { day: 'Saturday', open: '09:00', close: '20:00', closed: false },
    { day: 'Sunday', open: '10:00', close: '14:00', closed: false },
  ],
  timeSlots: { open: '09:00', close: '20:00', interval: 30 },
  payments: {
    requirePayment: true,
    advanceAmount: 100,
    paymentMode: 'both',
    upiId: 'freshcuts@okhdfcbank',
    paymentQr: '',
  },
  businessStatus: 'active',
};

function defaultAvailability() {
  return Object.fromEntries(DAY_KEYS.map((d) => [d, { open: '09:00', close: '17:00', off: false }]));
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const clean = process.argv.includes('--clean');

  if (clean) {
    const removedBusinesses = await Business.deleteMany({ name: { $regex: `^${DEMO_TAG} ` } });
    const removedUsers = await User.deleteMany({ email: { $regex: '^qb-demo-' } });
    console.log(`[dev-seed-profile] Cleaned ${removedBusinesses.deletedCount} demo business(es) and ${removedUsers.deletedCount} demo user(s).`);
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  const existing = await Business.findOne({ name: DEMO_BUSINESS.name });
  if (existing) {
    console.log(`[dev-seed-profile] Skipping (already exists): ${DEMO_BUSINESS.name}`);
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  const ownerEmail = 'qb-demo-freshcuts-owner@queuebook.demo';
  let owner = await User.findOne({ email: ownerEmail });
  if (!owner) {
    owner = await User.create({
      name: 'Fresh Cuts Salon (Demo Owner)',
      email: ownerEmail,
      password: DEMO_PASSWORD,
      role: 'business',
      isActive: true,
    });
  }

  const business = await Business.create({
    owner: owner._id,
    name: DEMO_BUSINESS.name,
    description: DEMO_BUSINESS.description,
    category: DEMO_BUSINESS.category,
    subcategory: DEMO_BUSINESS.subcategory,
    address: DEMO_BUSINESS.address,
    city: DEMO_BUSINESS.city,
    state: DEMO_BUSINESS.state,
    pincode: DEMO_BUSINESS.pincode,
    website: DEMO_BUSINESS.website,
    phone: DEMO_BUSINESS.phone,
    email: ownerEmail,
    location: DEMO_BUSINESS.location,
    services: DEMO_BUSINESS.services,
    openingHours: DEMO_BUSINESS.openingHours,
    timeSlots: DEMO_BUSINESS.timeSlots,
    avgServiceTime: DEMO_BUSINESS.avgServiceTime,
    payments: DEMO_BUSINESS.payments,
    businessStatus: DEMO_BUSINESS.businessStatus,
    approvalStatus: 'approved',
    isActive: true,
    rating: 0,
  });

  const serviceIdMap = new Map((business.services || []).map((s) => [s.name, s._id]));
  for (const member of STAFF_TEMPLATE) {
    business.staff.push({
      name: member.name,
      role: member.role,
      phone: member.phone,
      services: (member.services || [])
        .map((n) => serviceIdMap.get(n))
        .filter(Boolean),
      isActive: true,
      availability: { ...defaultAvailability(), ...member.availability },
    });
  }
  await business.save();

  console.log(`[dev-seed-profile] Created: ${business.name} (owner ${owner.email})`);
  console.log(`[dev-seed-profile] Services: ${business.services.map((s) => s.name).join(', ')}`);
  console.log(`[dev-seed-profile] Staff: ${business.staff.map((s) => s.name).join(', ')}`);

  await mongoose.disconnect();
  console.log('[dev-seed-profile] Done. This script is DEVELOPMENT-ONLY.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[dev-seed-profile] Failed:', err.message);
  process.exit(1);
});
