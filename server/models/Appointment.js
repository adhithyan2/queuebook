const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  service: { type: String, required: true },
  staff: { type: mongoose.Schema.Types.ObjectId },
  staffName: { type: String, default: '' },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  bookingType: {
    type: String,
    enum: ['walk_in', 'advance'],
    default: 'walk_in',
  },
  expectedStartTime: { type: String, default: '' },
  expectedEndTime: { type: String, default: '' },
  arrivalWindowStart: { type: Date, default: null },
  arrivalDeadline: { type: Date, default: null },
  queueEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Queue', default: null },
  checkedInAt: { type: Date, default: null },
  tokenNumber: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'skipped'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'not_required'],
    default: 'not_required',
  },
  advanceAmount: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  paymentMethod: { type: String, default: '' },
  paymentTransactionId: { type: String, default: '' },
  paymentInitiatedAt: { type: Date, default: null },
  paidAt: { type: Date, default: null },
  reminderSentAt: { type: Date, default: null },
  notes: { type: String, default: '' },
}, { timestamps: true });

appointmentSchema.index({ user: 1, date: -1 });
appointmentSchema.index({ business: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
