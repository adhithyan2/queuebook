const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const { getTodayRange, generateTokenNumber } = require('../utils/helpers');

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

    await Queue.create({
      business,
      user: req.user._id,
      appointment: appointment._id,
      tokenNumber,
      queueDate: start,
      status: 'waiting',
    });

    appointment.tokenNumber = tokenNumber;
    await appointment.save();

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
    appointment.status = 'cancelled';
    await appointment.save();

    await Queue.findOneAndUpdate(
      { appointment: req.params.id },
      { status: 'cancelled' }
    );

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

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
};
