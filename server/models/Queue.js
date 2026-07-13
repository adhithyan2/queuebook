const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  walkInName: { type: String, default: '' },
  tokenNumber: { type: Number, required: true },
  queueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['waiting', 'called', 'completed', 'skipped', 'cancelled'],
    default: 'waiting',
  },
  position: { type: Number },
  estimatedWaitTime: { type: Number, default: 0 },
  calledAt: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true });

queueSchema.index({ business: 1, queueDate: 1, tokenNumber: 1 });
queueSchema.index({ business: 1, queueDate: 1, status: 1 });
queueSchema.index({ user: 1, queueDate: 1, status: 1 });

module.exports = mongoose.model('Queue', queueSchema);
