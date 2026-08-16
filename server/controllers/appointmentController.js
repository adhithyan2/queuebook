const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Business = require('../models/Business');
const User = require('../models/User');
const { getTodayRange, generateTokenNumber, appointmentDateTimeIST, addMinutesToTime, minutesToTime, timeToMinutes } = require('../utils/helpers');
const { notifyUser, formatDate, createInAppNotification } = require('../services/notificationService');
const { emitToBusiness, emitToUser, broadcastQueueRefresh } = require('../socket/queueHandler');
const { isSlotAvailable, pickAvailableStaff } = require('../services/availabilityService');
const { estimateWaitMinutes } = require('../services/etaService');

exports.createAppointment = async (req, res, next) => {
  try {
    const { business: businessId, service, date, timeSlot, notes, staff } = req.body;
    const { start } = getTodayRange();

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const sameDay = String(date || '').slice(0, 10) === todayKey;
    let timeMin = null;
    if (typeof timeSlot === 'string' && timeSlot.includes(':')) {
      const [h, m] = timeSlot.split(':').map(Number);
      if (!Number.isNaN(h) && !Number.isNaN(m)) timeMin = h * 60 + m;
    }
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (sameDay && timeMin !== null && timeMin <= nowMin) {
      return res.status(400).json({
        message: 'Selected time slot is in the past. Please pick a future slot.',
      });
    }

    const businessDoc = await Business.findById(businessId);
    if (!businessDoc) {
      return res.status(404).json({ message: 'Business not found' });
    }
    if (!businessDoc.isActive || businessDoc.approvalStatus !== 'approved') {
      return res.status(400).json({ message: 'This business is not accepting bookings right now' });
    }
    if (businessDoc.businessStatus && businessDoc.businessStatus !== 'active') {
      return res.status(400).json({ message: 'This business is temporarily closed for bookings' });
    }

    const matchedService = (businessDoc.services || []).find(
      (s) => s && String(s.name).trim().toLowerCase() === String(service || '').trim().toLowerCase()
    );
    if (!matchedService) {
      return res.status(400).json({ message: 'Selected service is not available' });
    }
    if (matchedService.isAvailable === false) {
      return res.status(400).json({ message: 'Selected service is currently not available' });
    }

    const requestDateStr = String(date || '').slice(0, 10);

    let staffDoc = null;
    let staffId = null;
    let staffName = '';
    if (staff && String(staff) !== 'any') {
      staffDoc = (businessDoc.staff || []).find((s) => String(s._id) === String(staff));
      if (!staffDoc) {
        return res.status(400).json({ message: 'Selected professional was not found' });
      }
      if (staffDoc.isActive === false) {
        return res.status(400).json({ message: 'Selected professional is not available right now' });
      }
      const offers = (staffDoc.services || []).some((id) => String(id) === String(matchedService._id));
      if (!offers) {
        return res.status(400).json({ message: `${staffDoc.name} does not offer this service` });
      }
      staffId = staffDoc._id;
      staffName = staffDoc.name;
    }

    const availabilityCheck = await isSlotAvailable(
      businessDoc,
      requestDateStr,
      timeSlot,
      staffDoc,
      { serviceDuration: matchedService?.duration }
    );
    if (!availabilityCheck.ok) {
      return res.status(400).json({ message: availabilityCheck.message });
    }

    if (!staffDoc) {
      const assigned = await pickAvailableStaff(businessDoc, requestDateStr, timeSlot, {
        serviceDuration: matchedService?.duration,
        serviceId: matchedService._id,
      });
      if (assigned) {
        staffDoc = assigned;
        staffId = assigned._id;
        staffName = assigned.name;
      }
    }

    const paymentConfig = businessDoc.payments || {};
    const requirePayment = Boolean(paymentConfig.requirePayment);
    const advanceAmount = requirePayment ? Number(paymentConfig.advanceAmount) || 0 : 0;

    let bookingType = String(req.body.bookingType || '').trim();
    if (!['walk_in', 'advance'].includes(bookingType)) {
      const interval = Number(businessDoc.timeSlots?.interval) || 30;
      bookingType = sameDay && timeMin !== null && timeMin <= nowMin + interval ? 'walk_in' : 'advance';
    }

    const serviceDuration = Number(matchedService.duration) > 0 ? Number(matchedService.duration) : 30;
    const appointmentSettings = businessDoc.appointmentSettings || {};
    const gracePeriodMin = Number(appointmentSettings.gracePeriodMin) > 0
      ? Number(appointmentSettings.gracePeriodMin)
      : 10;

    if (bookingType === 'advance') {
      if (appointmentSettings.advanceBookingEnabled === false) {
        return res.status(400).json({ message: 'This business is not accepting advance bookings right now' });
      }
      const maxDays = Number(appointmentSettings.maxAdvanceBookingDays) > 0
        ? Number(appointmentSettings.maxAdvanceBookingDays)
        : 30;
      const requestDateStart = new Date(`${requestDateStr}T00:00:00.000Z`);
      const todayStart = getTodayRange().start;
      const daysOut = Math.round((requestDateStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
      if (daysOut > maxDays) {
        return res.status(400).json({ message: `Advance bookings are only available up to ${maxDays} day(s) ahead` });
      }
    }

    const apptInstant = bookingType === 'advance' ? appointmentDateTimeIST(date, timeSlot) : null;

    const appointment = await Appointment.create({
      user: req.user._id,
      business: businessId,
      service,
      staff: staffId,
      staffName,
      date,
      timeSlot,
      notes,
      bookingType,
      expectedStartTime: timeSlot,
      expectedEndTime: addMinutesToTime(timeSlot, serviceDuration),
      arrivalWindowStart: apptInstant
        ? new Date(apptInstant.getTime() - gracePeriodMin * 60 * 1000)
        : null,
      arrivalDeadline: apptInstant
        ? new Date(apptInstant.getTime() + gracePeriodMin * 60 * 1000)
        : null,
      status: requirePayment ? 'pending' : (bookingType === 'advance' ? 'scheduled' : 'confirmed'),
      paymentStatus: requirePayment ? 'pending' : 'not_required',
      advanceAmount,
    });

    if (requirePayment) {
      res.status(201).json({ appointment, paymentRequired: true });
      return;
    }

    if (bookingType === 'advance') {
      await notifyUser({
        user: req.user,
        business: businessDoc,
        queue: null,
        appointment: appointment._id,
        type: 'appointment_scheduled',
        templateData: {
          businessName: businessDoc?.name || 'the business',
          date: formatDate(appointment.date),
          timeSlot: appointment.timeSlot,
          startTime: appointment.expectedStartTime,
          endTime: appointment.expectedEndTime,
          arriveBy: minutesToTime((timeToMinutes(appointment.timeSlot) ?? 0) - gracePeriodMin),
          staffName: appointment.staffName || '',
        },
      });

      if (businessDoc?.owner) {
        await createInAppNotification({
          user: { _id: businessDoc.owner },
          title: 'New advance booking received',
          message: `${req.user.name} booked ${service} for ${timeSlot}${appointment.staffName ? ` with ${appointment.staffName}` : ''}`,
          type: 'appointment',
          data: {
            business: businessDoc._id,
            appointment: appointment._id,
            type: 'booking_confirmed',
          },
        });
        emitToBusiness(businessDoc._id, 'booking-notification', {
          message: 'New advance booking received',
          timestamp: new Date(),
        });
        emitToBusiness(businessDoc._id, 'appointments-refresh', { refresh: true, timestamp: new Date() });
      }

      res.status(201).json({ appointment });
      return;
    }

    const tokenNumber = await generateTokenNumber(Queue, businessId);

    const waitingCount = await Queue.countDocuments({
      business: businessId,
      queueDate: { $gte: start, $lte: getTodayRange().end },
      status: { $in: ['waiting', 'called'] },
      tokenNumber: { $lt: tokenNumber },
    });

    const queue = await Queue.create({
      business: businessId,
      user: req.user._id,
      appointment: appointment._id,
      tokenNumber,
      queueDate: start,
      status: 'waiting',
      position: waitingCount + 1,
      estimatedWaitTime: estimateWaitMinutes(waitingCount, businessDoc),
    });

    appointment.tokenNumber = tokenNumber;
    appointment.queueEntryId = queue._id;
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
        waitTime: estimateWaitMinutes(waitingCount, businessDoc),
      },
    });

    if (businessDoc?.owner) {
      await createInAppNotification({
        user: { _id: businessDoc.owner },
        title: 'New booking received',
        message: `${req.user.name} booked ${service}${timeSlot ? ` at ${timeSlot}` : ''} — Token ${tokenNumber}`,
        type: 'appointment',
        data: {
          queue: queue._id,
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

    res.status(201).json({ appointment });
  } catch (error) {
    next(error);
  }
};

async function assignLiveQueue(appointment, businessDoc) {
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
    estimatedWaitTime: estimateWaitMinutes(waitingCount, businessDoc),
  });
  appointment.tokenNumber = tokenNumber;
  appointment.queueEntryId = queue._id;
  appointment.status = 'checked_in';
  appointment.checkedInAt = new Date();
  await appointment.save();
  return { queue, waitingCount };
}

exports.checkInAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const business = await Business.findById(appointment.business);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    if (!business.isActive || business.approvalStatus !== 'approved') {
      return res.status(400).json({ message: 'This business is not accepting customers right now' });
    }

    const isOwner = appointment.user.toString() === req.user._id.toString();
    const isBusinessOwner = String(business.owner || '') === String(req.user._id);
    if (!isOwner && !isBusinessOwner) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // A booking is NOT the same as being physically present. Check-in is only
    // allowed for bookings that are still active (not completed/cancelled/etc).
    if (['completed', 'cancelled', 'in_progress', 'skipped', 'no_show'].includes(appointment.status)) {
      return res.status(400).json({
        message: `Cannot check in. Your appointment is already ${appointment.status.replace('_', ' ')}.`,
      });
    }

    // Prevent duplicate check-ins.
    const existingQueue = await Queue.findOne({
      appointment: appointment._id,
      status: { $in: ['waiting', 'called'] },
    });
    if (existingQueue) {
      return res.status(400).json({ message: 'You are already checked in and in the live queue' });
    }

    // Configurable check-in window around the appointment time.
    // Advance bookings can only check in from (start - grace) onward.
    const appointmentSettings = business.appointmentSettings || {};
    const gracePeriodMin = Number(appointmentSettings.gracePeriodMin) > 0
      ? Number(appointmentSettings.gracePeriodMin)
      : 10;
    const now = new Date();
    let late = false;

    if (appointment.bookingType === 'advance') {
      const earliest = appointment.arrivalWindowStart
        ? new Date(appointment.arrivalWindowStart.getTime())
        : null;
      if (earliest && now < earliest) {
        const hh = String(earliest.getHours()).padStart(2, '0');
        const mm = String(earliest.getMinutes()).padStart(2, '0');
        return res.status(400).json({
          message: `Check-in for this appointment opens at ${hh}:${mm}. Please arrive around your appointment time.`,
        });
      }
      if (appointment.arrivalDeadline && now > new Date(appointment.arrivalDeadline.getTime())) {
        late = true;
      }
    }

    const { queue, waitingCount } = await assignLiveQueue(appointment, business);

    await notifyUser({
      user: req.user,
      business,
      queue,
      appointment: appointment._id,
      type: 'appointment_checked_in',
      templateData: {
        businessName: business.name || 'the business',
        tokenNumber: queue.tokenNumber,
        peopleAhead: waitingCount,
        waitTime: estimateWaitMinutes(waitingCount, business),
        late,
      },
    });

    emitToBusiness(business._id, 'queue-refresh', { refresh: true, timestamp: new Date() });
    emitToBusiness(business._id, 'appointments-refresh', { refresh: true, timestamp: new Date() });
    emitToUser(appointment.user, 'position-update', { refresh: true, timestamp: new Date() });
    await broadcastQueueRefresh(business._id);

    res.json({ appointment, queue, late });
  } catch (error) {
    next(error);
  }
};

exports.markNoShow = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const business = await Business.findOne({ owner: req.user._id });
    if (!business || String(appointment.business) !== String(business._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (['completed', 'cancelled', 'no_show', 'in_progress', 'skipped'].includes(appointment.status)) {
      return res.status(400).json({
        message: `Cannot mark a ${appointment.status.replace('_', ' ')} appointment as no-show`,
      });
    }

    appointment.status = 'no_show';
    await appointment.save();

    const queue = await Queue.findOneAndUpdate(
      { appointment: appointment._id },
      { status: 'skipped' },
      { new: true }
    );

    const customer = await User.findById(appointment.user);
    await notifyUser({
      user: customer,
      business,
      queue,
      appointment: appointment._id,
      type: 'cancelled',
      templateData: {
        businessName: business.name || 'the business',
        tokenNumber: queue?.tokenNumber || appointment.tokenNumber,
      },
    });

    emitToBusiness(business._id, 'appointments-refresh', { refresh: true, timestamp: new Date() });
    if (queue) emitToBusiness(business._id, 'queue-refresh', { refresh: true, timestamp: new Date() });

    res.json({ appointment });
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

    if (['completed', 'cancelled', 'no_show', 'in_progress'].includes(appointment.status)) {
      return res.status(400).json({
        message: `Cannot cancel an appointment that is ${appointment.status.replace('_', ' ')}`,
      });
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
    if (['cancelled', 'completed', 'in_progress', 'no_show'].includes(appointment.status)) {
      return res.status(400).json({ message: `Cannot reschedule a ${appointment.status.replace('_', ' ')} appointment` });
    }

    const queue = await Queue.findOne({ appointment: appointment._id });
    if (queue && queue.status === 'called') {
      return res.status(400).json({ message: 'Cannot reschedule after you have been called' });
    }

    const newDate = String(date || '').slice(0, 10);
    const newSlot = timeSlot || appointment.timeSlot;

    const businessDoc = await Business.findById(appointment.business).select('name owner staff services appointmentSettings avgServiceTime');
    let gracePeriodMin = 10;
    if (businessDoc) {
      gracePeriodMin = Number(businessDoc.appointmentSettings?.gracePeriodMin) > 0
        ? Number(businessDoc.appointmentSettings.gracePeriodMin)
        : 10;
      let staffDoc = null;
      if (appointment.staff) {
        staffDoc = (businessDoc.staff || []).find((s) => String(s._id) === String(appointment.staff));
        if (!staffDoc) {
          return res.status(400).json({ message: 'Selected professional is no longer available' });
        }
      }
      const matchedService = (businessDoc.services || []).find(
        (s) => s && String(s.name).trim().toLowerCase() === String(appointment.service).trim().toLowerCase()
      );
      const check = await isSlotAvailable(businessDoc, newDate, newSlot, staffDoc, {
        serviceDuration: matchedService?.duration,
      });
      if (!check.ok) {
        return res.status(400).json({ message: check.message });
      }
    }

    appointment.date = date || appointment.date;
    appointment.timeSlot = newSlot;
    appointment.status = appointment.bookingType === 'advance' ? 'scheduled' : 'confirmed';
    if (appointment.bookingType === 'advance') {
      const matchedService = (businessDoc?.services || []).find(
        (s) => s && String(s.name).trim().toLowerCase() === String(appointment.service).trim().toLowerCase()
      );
      const duration = matchedService && Number(matchedService.duration) > 0 ? Number(matchedService.duration) : 30;
      const instant = appointmentDateTimeIST(appointment.date, newSlot);
      appointment.expectedStartTime = newSlot;
      appointment.expectedEndTime = addMinutesToTime(newSlot, duration);
      appointment.arrivalWindowStart = instant ? new Date(instant.getTime() - gracePeriodMin * 60 * 1000) : null;
      appointment.arrivalDeadline = instant ? new Date(instant.getTime() + gracePeriodMin * 60 * 1000) : null;
    }
    await appointment.save();

    if (queue && ['waiting', 'completed'].includes(queue.status)) {
      queue.queueDate = getTodayRange().start;
      queue.status = 'waiting';
      queue.calledAt = undefined;
      await queue.save();
    }

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
