const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  service: { type: String, required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  tokenNumber: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  notes: { type: String, default: '' },
}, { timestamps: true });

appointmentSchema.index({ user: 1, date: -1 });
appointmentSchema.index({ business: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
