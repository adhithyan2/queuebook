const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const { notifyUser } = require('./notificationService');

const REMIND_AHEAD_MIN = 45;
const CHECK_INTERVAL_MS = 60 * 1000;

function slotToMinutes(timeSlot) {
  if (!timeSlot || typeof timeSlot !== 'string') return null;
  const [h, m] = timeSlot.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

async function sendAppointmentReminders() {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed', 'scheduled'] },
      reminderSentAt: null,
    })
      .populate('user', 'name email phone phoneVerified')
      .select('user business service date timeSlot');

    const nowMin = now.getHours() * 60 + now.getMinutes();

    for (const appointment of appointments) {
      const slotMin = slotToMinutes(appointment.timeSlot);
      if (slotMin === null) continue;
      const minutesUntil = slotMin - nowMin;
      if (minutesUntil <= 0 || minutesUntil > REMIND_AHEAD_MIN) continue;

      const business = await Business.findById(appointment.business).select('name');
      await notifyUser({
        user: appointment.user,
        business,
        queue: null,
        appointment: appointment._id,
        type: 'appointment_reminder',
        templateData: {
          businessName: business?.name || 'the business',
          date: appointment.date.toISOString().split('T')[0],
          timeSlot: appointment.timeSlot,
        },
      });

      await Appointment.findByIdAndUpdate(appointment._id, { reminderSentAt: now });
    }
  } catch (err) {
    console.error('Reminder scheduler error:', err.message);
  }
}

let timer = null;

function startReminderScheduler() {
  if (timer) return;
  timer = setInterval(sendAppointmentReminders, CHECK_INTERVAL_MS);
  timer.unref && timer.unref();
  sendAppointmentReminders();
}

module.exports = { startReminderScheduler, sendAppointmentReminders };
