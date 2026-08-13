const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Business = require('../models/Business');
const User = require('../models/User');
const { getTodayRange, generateTokenNumber } = require('../utils/helpers');
const { notifyUser, formatDate } = require('../services/notificationService');

exports.createAppointment = async (req, res, next) => {
  try {
    const { business, service, date, timeSlot, notes } = req.body;
    const { start } = getTodayRange();

    const appointment = await Appointment.create({
      user: req.user._id,
      business,
      service,
      date,
      timeSlot,
      notes,
      status: 'confirmed',
    });

    const tokenNumber = await generateTokenNumber(Queue, business);

    const businessDoc = await Business.findById(business).select('name avgServiceTime');
    const waitingCount = await Queue.countDocuments({
      business,
      queueDate: { $gte: start, $lte: getTodayRange().end },
      status: { $in: ['waiting', 'called'] },
      tokenNumber: { $lt: tokenNumber },
    });

    const queue = await Queue.create({
      business,
      user: req.user._id,
      appointment: appointment._id,
      tokenNumber,
      queueDate: start,
      status: 'waiting',
      position: waitingCount + 1,
      estimatedWaitTime: waitingCount * (businessDoc?.avgServiceTime || 5),
    });

    appointment.tokenNumber = tokenNumber;
    await appointment.save();

    await notifyUser({
      user: req.user,
      business: businessDoc,
      queue,
      appointment: appointment._id,
      type: 'booking_confirmed',
      templateData: {
        businessName: businessDoc?.name || 'the business',
        tokenNumber,
        peopleAhead: waitingCount,
        waitTime: waitingCount * (businessDoc?.avgServiceTime || 5),
      },
    });

    res.status(201).json({ appointment });
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
    if (['cancelled', 'completed'].includes(appointment.status)) {
      return res.status(400).json({ message: `Cannot reschedule a ${appointment.status} appointment` });
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
