const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Business = require('../models/Business');
const User = require('../models/User');
const { getTodayRange, generateTokenNumber } = require('../utils/helpers');
const { notifyUser, formatDate, createInAppNotification } = require('../services/notificationService');
const { emitToBusiness } = require('../socket/queueHandler');

const CHECKIN_WINDOW_MINUTES = 15;

exports.createAppointment = async (req, res, next) => {
  try {
    const { business, service, date, timeSlot, notes } = req.body;
    const { start, end } = getTodayRange();

    const tokenNumber = await generateTokenNumber(Queue, business);
    const businessDoc = await Business.findById(business).select('name avgServiceTime owner');

    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);
    const isToday = appointmentDate.getTime() === start.getTime();

    const appointment = await Appointment.create({
      user: req.user._id,
      business,
      service,
      date,
      timeSlot,
      notes,
      status: 'confirmed',
      tokenNumber,
    });

    let queue = null;

    if (isToday) {
      const waitingCount = await Queue.countDocuments({
        business,
        queueDate: { $gte: start, $lte: end },
        status: { $in: ['waiting', 'called'] },
        tokenNumber: { $lt: tokenNumber },
      });

      queue = await Queue.create({
        business,
        user: req.user._id,
        appointment: appointment._id,
        tokenNumber,
        queueDate: start,
        status: 'waiting',
        position: waitingCount + 1,
        estimatedWaitTime: waitingCount * (businessDoc?.avgServiceTime || 5),
      });

      appointment.status = 'checked_in';
      await appointment.save();
    }

    await notifyUser({
      user: req.user,
      business: businessDoc,
      queue,
      appointment: appointment._id,
      type: 'booking_confirmed',
      templateData: {
        businessName: businessDoc?.name || 'the business',
        tokenNumber,
        peopleAhead: queue ? (queue.position - 1) : 0,
        waitTime: queue ? queue.estimatedWaitTime : 0,
      },
    });

    if (businessDoc?.owner) {
      await createInAppNotification({
        user: { _id: businessDoc.owner },
        title: 'New booking received',
        message: `${req.user.name} booked ${service}${timeSlot ? ' at ' + timeSlot : ''} -- Token ${tokenNumber}`,
        type: 'appointment',
        data: {
          queue: queue?._id,
          business: businessDoc._id,
          appointment: appointment._id,
          type: 'booking_confirmed',
        },
      });
      emitToBusiness(businessDoc._id, 'booking-notification', {
        message: 'New booking received',
        timestamp: new Date(),
      });
      emitToBusiness(businessDoc._id, 'queue-refresh', { refresh: true, timestamp: new Date() });
    }

    res.status(201).json({ appointment, queue });
  } catch (error) {
    next(error);
  }
};

exports.getAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id })
      .populate('business', 'name category')
      .sort({ date: -1 });
    res.json({ appointments });
  } catch (error) {
    next(error);
  }
};

exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('business', 'name category address')
      .populate('user', 'name email');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json({ appointment });
  } catch (error) {
    next(error);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const businessDoc = await Business.findById(appointment.business).select('name owner');
    const isOwner = appointment.user.toString() === req.user._id.toString();
    const isBusinessOwner = businessDoc && businessDoc.owner?.toString() === req.user._id.toString();
    if (!isOwner && !isBusinessOwner) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    const queue = await Queue.findOneAndUpdate(
      { appointment: req.params.id },
      { status: 'cancelled' },
      { new: true }
    );

    const customer = await User.findById(appointment.user);
    await notifyUser({
      user: customer,
      business: businessDoc,
      queue,
      appointment: appointment._id,
      type: 'cancelled',
      templateData: {
        businessName: businessDoc?.name || 'the business',
        tokenNumber: queue?.tokenNumber || appointment.tokenNumber,
      },
    });

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
};

exports.rescheduleAppointment = async (req, res, next) => {
  try {
    const { date, timeSlot } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (['cancelled', 'completed', 'checked_in'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Cannot reschedule a ' + appointment.status + ' appointment' });
    }

    const queue = await Queue.findOne({ appointment: appointment._id });
    if (queue && queue.status === 'called') {
      return res.status(400).json({ message: 'Cannot reschedule after you have been called' });
    }

    appointment.date = date || appointment.date;
    appointment.timeSlot = timeSlot || appointment.timeSlot;
    appointment.status = 'confirmed';
    await appointment.save();

    if (queue && ['waiting', 'completed'].includes(queue.status)) {
      queue.queueDate = getTodayRange().start;
      queue.status = 'waiting';
      queue.calledAt = undefined;
      await queue.save();
    }

    const businessDoc = await Business.findById(appointment.business).select('name');
    await notifyUser({
      user: req.user,
      business: businessDoc,
      queue,
      appointment: appointment._id,
      type: 'rescheduled',
      templateData: {
        businessName: businessDoc?.name || 'the business',
        date: formatDate(appointment.date),
        timeSlot: appointment.timeSlot,
      },
    });

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
};

exports.checkinAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('business', 'name avgServiceTime owner');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const isOwner = appointment.user.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot check in to a cancelled appointment' });
    }
    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Appointment already completed' });
    }
    if (appointment.status === 'checked_in') {
      const existingQueue = await Queue.findOne({ appointment: appointment._id });
      if (existingQueue) {
        return res.status(400).json({ message: 'Already checked in' });
      }
    }

    const { start, end } = getTodayRange();
    const appointmentDate = new Date(appointment.date);
    appointmentDate.setHours(0, 0, 0, 0);
    const isToday = appointmentDate.getTime() === start.getTime();

    if (!isToday) {
      return res.status(400).json({
        message: 'Check-in is available on ' + appointment.date.toISOString().split('T')[0] + ' (appointment date)',
      });
    }

    if (appointment.timeSlot) {
      const parts = appointment.timeSlot.split(':').map(Number);
      const slotMinutes = parts[0] * 60 + parts[1];
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      if (currentMinutes < slotMinutes - CHECKIN_WINDOW_MINUTES) {
        const opensMin = slotMinutes - CHECKIN_WINDOW_MINUTES;
        const opensH = String(Math.floor(opensMin / 60)).padStart(2, '0');
        const opensM = String(opensMin % 60).padStart(2, '0');
        return res.status(400).json({
          message: 'Check-in for this appointment opens at ' + opensH + ':' + opensM + '. Please arrive around your appointment time.',
        });
      }
    }

    const existingQueue = await Queue.findOne({ appointment: appointment._id });
    if (existingQueue) {
      return res.status(400).json({ message: 'Already checked in' });
    }

    const waitingCount = await Queue.countDocuments({
      business: appointment.business._id,
      queueDate: { $gte: start, $lte: end },
      status: { $in: ['waiting', 'called'] },
      tokenNumber: { $lt: appointment.tokenNumber },
    });

    const queue = await Queue.create({
      business: appointment.business._id,
      user: req.user._id,
      appointment: appointment._id,
      tokenNumber: appointment.tokenNumber,
      queueDate: start,
      status: 'waiting',
      position: waitingCount + 1,
      estimatedWaitTime: waitingCount * (appointment.business?.avgServiceTime || 5),
    });

    appointment.status = 'checked_in';
    await appointment.save();

    const businessDoc = appointment.business;

    await notifyUser({
      user: req.user,
      business: businessDoc,
      queue,
      appointment: appointment._id,
      type: 'position_update',
      templateData: {
        businessName: businessDoc?.name || 'the business',
        peopleAhead: waitingCount,
        waitTime: waitingCount * (businessDoc?.avgServiceTime || 5),
      },
    });

    if (businessDoc?.owner) {
      await createInAppNotification({
        user: { _id: businessDoc.owner },
        title: 'Customer checked in',
        message: req.user.name + ' checked in (Token ' + appointment.tokenNumber + ')',
        type: 'appointment',
        data: {
          queue: queue._id,
          business: businessDoc._id,
          appointment: appointment._id,
          type: 'checked_in',
        },
      });
      emitToBusiness(businessDoc._id, 'queue-refresh', { refresh: true, timestamp: new Date() });
    }

    res.json({ appointment, queue });
  } catch (error) {
    next(error);
  }
};
