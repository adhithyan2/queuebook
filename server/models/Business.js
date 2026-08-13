const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, required: true, lowercase: true, trim: true },
  address: { type: String, default: '' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  services: [{ name: String, duration: Number, price: Number }],
  timeSlots: { open: String, close: String, interval: { type: Number, default: 30 } },
  openingHours: [{
    day: { type: String, default: '' },
    open: { type: String, default: '09:00' },
    close: { type: String, default: '17:00' },
    closed: { type: Boolean, default: false },
  }],
  avgServiceTime: { type: Number, default: 5 },
  queueSettings: {
    tokenPrefix: { type: String, default: 'Q' },
    maxDailyTokens: { type: Number, default: 100 },
    autoAssignToken: { type: Boolean, default: true },
    maxQueuePerCustomer: { type: Number, default: 1 },
    noShowTimeoutMin: { type: Number, default: 0 },
  },
  rating: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },
}, { timestamps: true });

businessSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Business', businessSchema);
