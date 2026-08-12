const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  queue: { type: mongoose.Schema.Types.ObjectId, ref: 'Queue' },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  channel: { type: String, enum: ['sms', 'whatsapp', 'console'], default: 'sms' },
  to: { type: String, default: '' },
  type: {
    type: String,
    enum: [
      'otp',
      'booking_confirmed',
      'position_update',
      'turn_coming',
      'turn_now',
      'completed',
      'cancelled',
      'rescheduled',
      'welcome',
    ],
    default: 'welcome',
  },
  content: { type: String, default: '' },
  status: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'sent' },
  provider: { type: String, default: 'console' },
  providerMessageId: { type: String, default: '' },
  error: { type: String, default: '' },
}, { timestamps: true });

messageLogSchema.index({ user: 1, createdAt: -1 });
messageLogSchema.index({ business: 1, createdAt: -1 });
messageLogSchema.index({ queue: 1 });

module.exports = mongoose.model('MessageLog', messageLogSchema);
