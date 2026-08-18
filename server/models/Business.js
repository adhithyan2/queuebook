const mongoose = require('mongoose');

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const dayAvailabilitySchema = new mongoose.Schema(
  {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '17:00' },
    off: { type: Boolean, default: false },
    breakStart: { type: String, default: '' },
    breakEnd: { type: String, default: '' },
  },
  { _id: false }
);

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  image: { type: String, default: '' },
  role: { type: String, default: '' },
  phone: { type: String, default: '' },
  services: [{ type: mongoose.Schema.Types.ObjectId }],
  isActive: { type: Boolean, default: true },
  availability: {
    monday: { type: dayAvailabilitySchema, default: () => ({}) },
    tuesday: { type: dayAvailabilitySchema, default: () => ({}) },
    wednesday: { type: dayAvailabilitySchema, default: () => ({}) },
    thursday: { type: dayAvailabilitySchema, default: () => ({}) },
    friday: { type: dayAvailabilitySchema, default: () => ({}) },
    saturday: { type: dayAvailabilitySchema, default: () => ({}) },
    sunday: { type: dayAvailabilitySchema, default: () => ({}) },
  },
}, { timestamps: true });

const businessSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, required: true, lowercase: true, trim: true },
  subcategory: { type: String, default: '', lowercase: true, trim: true },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  website: { type: String, default: '' },
  logo: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },
  },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  services: [{
    name: { type: String, required: true, trim: true },
    duration: { type: Number, default: 30 },
    price: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    description: { type: String, default: '' },
  }],
  timeSlots: { open: String, close: String, interval: { type: Number, default: 30 } },
  openingHours: [{
    day: { type: String, default: '' },
    open: { type: String, default: '09:00' },
    close: { type: String, default: '17:00' },
    closed: { type: Boolean, default: false },
  }],
  avgServiceTime: { type: Number },
  staff: { type: [staffSchema], default: [] },
  payments: {
    requirePayment: { type: Boolean, default: false },
    advanceAmount: { type: Number, default: 0 },
    paymentMode: {
      type: String,
      enum: ['online', 'pay_at_business', 'both'],
      default: 'both',
    },
    upiId: { type: String, default: '' },
    paymentQr: { type: String, default: '' },
  },
  queueSettings: {
    tokenPrefix: { type: String, default: 'Q' },
    maxDailyTokens: { type: Number, default: 100 },
    autoAssignToken: { type: Boolean, default: true },
    maxQueuePerCustomer: { type: Number, default: 1 },
    noShowTimeoutMin: { type: Number, default: 0 },
  },
  appointmentSettings: {
    gracePeriodMin: { type: Number, default: 10 },
    advanceBookingEnabled: { type: Boolean, default: true },
    maxAdvanceBookingDays: { type: Number, default: 30 },
  },
  rating: { type: Number },
  isActive: { type: Boolean, default: true },
  businessStatus: {
    type: String,
    enum: ['active', 'inactive', 'temporarily_closed'],
    default: 'active',
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },
}, { timestamps: true });

businessSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Business', businessSchema);
module.exports.DAY_KEYS = DAY_KEYS;
