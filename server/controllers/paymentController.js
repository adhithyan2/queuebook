const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const Queue = require('../models/Queue');
const { getTodayRange, generateTokenNumber } = require('../utils/helpers');
const { notifyUser } = require('../services/notificationService');
const { estimateWaitMinutes } = require('../services/etaService');
const { emitToBusiness } = require('../socket/queueHandler');

function paymentConfigView(business) {
  const payments = business.payments || {};
  const gatewayConfigured = Boolean(payments.upiId || payments.paymentQr);
  return {
    requirePayment: Boolean(payments.requirePayment),
    advanceAmount: Number(payments.advanceAmount) || 0,
    paymentMode: payments.paymentMode || 'both',
    upiId: payments.upiId || '',
    paymentQr: payments.paymentQr || '',
    gatewayConfigured,
  };
}

const isOnlineMethod = (method) => {
  const m = String(method || '').trim().toLowerCase();
  return m && m !== 'pay_at_business' && m !== 'cash';
};

async function createQueueForAppointment(appointment, business) {
  if (appointment.bookingType === 'advance') return null;
  const existingQueue = await Queue.findOne({ appointment: appointment._id });
  if (existingQueue) return existingQueue;

  const { start, end } = getTodayRange();
  const tokenNumber = await generateTokenNumber(Queue, appointment.business);
  const waitingCount = await Queue.countDocuments({
    business: appointment.business,
    queueDate: { $gte: start, $lte: end },
    status: { $in: ['waiting', 'called'] },
    tokenNumber: { $lt: tokenNumber },
  });
  const queue = await Queue.create({
    business: appointment.business,
    user: appointment.user,
    appointment: appointment._id,
    tokenNumber,
    queueDate: start,
    status: 'waiting',
    position: waitingCount + 1,
    estimatedWaitTime: estimateWaitMinutes(waitingCount, business),
  });
  appointment.tokenNumber = tokenNumber;
  await appointment.save();
  emitToBusiness(appointment.business, 'queue-refresh', { refresh: true, timestamp: new Date() });
  return queue;
}

async function notifyBookingConfirmed(appointment, business, queue, recipient) {
  const waitingCount = await Queue.countDocuments({
    business: appointment.business,
    queueDate: { $gte: getTodayRange().start, $lte: getTodayRange().end },
    status: { $in: ['waiting', 'called'] },
    tokenNumber: { $lt: queue.tokenNumber },
  });
  await notifyUser({
    user: recipient,
    business,
    queue,
    appointment: appointment._id,
    type: 'booking_confirmed',
    templateData: {
      businessName: business.name || 'the business',
      tokenNumber: queue.tokenNumber,
      peopleAhead: waitingCount,
      waitTime: estimateWaitMinutes(waitingCount, business),
    },
  });
}

async function notifyAppointmentScheduled(appointment, business, recipient) {
  await notifyUser({
    user: recipient,
    business,
    queue: null,
    appointment: appointment._id,
    type: 'appointment_scheduled',
    templateData: {
      businessName: business.name || 'the business',
      date: appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : '',
      timeSlot: appointment.timeSlot,
      startTime: appointment.expectedStartTime || appointment.timeSlot,
      endTime: appointment.expectedEndTime || '',
      arriveBy: appointment.arrivalWindowStart
        ? `${String(appointment.arrivalWindowStart.getHours()).padStart(2, '0')}:${String(appointment.arrivalWindowStart.getMinutes()).padStart(2, '0')}`
        : '',
      staffName: appointment.staffName || '',
    },
  });
}

exports.getAppointmentPayment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    const isOwner = appointment.user.toString() === req.user._id.toString();
    const isBusinessOwner =
      req.user.role === 'business' &&
      (await Business.exists({ _id: appointment.business, owner: req.user._id }));

    if (!isOwner && !isBusinessOwner) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const business = await Business.findById(appointment.business).select(
      'name payments timeSlots services'
    );
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const matchedService = (business.services || []).find(
      (s) => s && String(s.name).trim().toLowerCase() === String(appointment.service).trim().toLowerCase()
    );
    const servicePrice = matchedService && Number(matchedService.price) > 0
      ? Number(matchedService.price)
      : 0;

    res.json({
      appointment: {
        _id: appointment._id,
        status: appointment.status,
        paymentStatus: appointment.paymentStatus,
        advanceAmount: Number(appointment.advanceAmount) || 0,
        amount: Number(appointment.amount) || 0,
        paymentMethod: appointment.paymentMethod || '',
        paymentTransactionId: appointment.paymentTransactionId || '',
        paymentInitiatedAt: appointment.paymentInitiatedAt || null,
        paidAt: appointment.paidAt || null,
        servicePrice,
      },
      business: {
        name: business.name,
        ...paymentConfigView(business),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.payAppointment = async (req, res, next) => {
  try {
    const { method, transactionId } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appointment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Payment for this appointment is already completed' });
    }
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({
        message: `Cannot pay for a ${appointment.status.replace('_', ' ')} appointment`,
      });
    }

    const business = await Business.findById(appointment.business).select('name payments avgServiceTime staff');
    if (!business || !business.payments?.requirePayment) {
      return res.status(400).json({ message: 'This business does not require an advance payment' });
    }

    const advance = Number(business.payments.advanceAmount) || 0;

    if (isOnlineMethod(method)) {
      appointment.paymentMethod = String(method).trim();
      appointment.paymentTransactionId = String(transactionId || '').trim();
      appointment.paymentInitiatedAt = new Date();
      appointment.paymentStatus = 'pending';
      await appointment.save();

      await notifyUser({
        user: req.user,
        business,
        appointment: appointment._id,
        type: 'payment_pending_verification',
        templateData: {
          businessName: business.name || 'the business',
          amount: advance,
        },
      });

      return res.json({
        appointment,
        awaitingVerification: true,
        message: 'Payment details submitted. The business will confirm your payment before you get a token.',
      });
    }

    const counterMethod = String(method || 'pay_at_business').trim();
    appointment.paymentMethod = counterMethod;
    appointment.paymentStatus = 'pending';
    appointment.paymentInitiatedAt = new Date();
    if (appointment.status === 'pending') {
      appointment.status = appointment.bookingType === 'advance' ? 'scheduled' : 'confirmed';
    }
    await appointment.save();

    const queue = await createQueueForAppointment(appointment, business);
    if (queue) {
      await notifyBookingConfirmed(appointment, business, queue, req.user);
    } else if (appointment.bookingType === 'advance') {
      await notifyAppointmentScheduled(appointment, business, req.user);
    }

    res.json({
      appointment,
      payAtBusiness: true,
      message: 'Booking confirmed. The advance will be collected at the business.',
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyAppointmentPayment = async (req, res, next) => {
  try {
    const { status } = req.body;

    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (String(appointment.business) !== String(business._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Payment for this appointment is already confirmed' });
    }

    const desired = String(status || 'paid').toLowerCase();

    if (desired === 'failed') {
      appointment.paymentStatus = 'failed';
      await appointment.save();
      return res.json({
        appointment,
        message: 'Payment marked as failed. The customer can retry or pay at the business.',
      });
    }

    if (desired !== 'paid') {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const advance = Number(business.payments?.advanceAmount) || 0;
    appointment.paymentStatus = 'paid';
    appointment.amount = Number(appointment.amount) || advance;
    appointment.paidAt = new Date();
    if (appointment.status === 'pending') {
      appointment.status = appointment.bookingType === 'advance' ? 'scheduled' : 'confirmed';
    }
    await appointment.save();

    const queue = await createQueueForAppointment(appointment, business);
    if (queue) {
      await notifyBookingConfirmed(appointment, business, queue, appointment.user);
    } else if (appointment.bookingType === 'advance') {
      await notifyAppointmentScheduled(appointment, business, appointment.user);
    }

    emitToBusiness(business._id, 'queue-refresh', { refresh: true, timestamp: new Date() });
    emitToBusiness(business._id, 'appointments-refresh', { refresh: true, timestamp: new Date() });

    res.json({ appointment, message: 'Payment confirmed. Token assigned to the customer.' });
  } catch (error) {
    next(error);
  }
};

exports.collectQueuePayment = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const queue = await Queue.findById(req.params.id).populate('user', 'name email phone phoneVerified');
    if (!queue) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }
    if (String(queue.business) !== String(business._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { amount, method } = req.body;

    let appointment = null;
    if (queue.appointment) {
      appointment = await Appointment.findById(queue.appointment);
      if (appointment) {
        if (amount !== undefined && Number(amount) >= 0) {
          appointment.paymentStatus = 'paid';
          appointment.amount = Number(amount);
          appointment.paymentMethod = String(method || 'pay_at_business').trim();
          appointment.paymentTransactionId = '';
          appointment.paymentInitiatedAt = appointment.paymentInitiatedAt || new Date();
          appointment.paidAt = new Date();
          await appointment.save();
        }
      }
    }

    if (appointment) {
      await notifyUser({
        user: queue.user,
        business,
        queue,
        appointment: appointment._id,
        type: 'payment_received',
        templateData: {
          businessName: business.name || 'the business',
          amount: Number(appointment.amount) || 0,
          tokenNumber: appointment.tokenNumber || queue.tokenNumber || '',
        },
      });
    }

    res.json({ queue, appointment });
  } catch (error) {
    next(error);
  }
};
