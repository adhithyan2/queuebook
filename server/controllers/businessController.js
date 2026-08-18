const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const { getTodayRange, generateTokenNumber, calculateWaitTime } = require('../utils/helpers');
const { notifyUser } = require('../services/notificationService');

async function notifyUpcomingUsers(businessId, businessName, avgServiceTime, limit = 2) {
  const { start, end } = getTodayRange();
  const upcoming = await Queue.find({
    business: businessId,
    queueDate: { $gte: start, $lte: end },
    status: 'waiting',
  })
    .populate('user', 'name email phone phoneVerified')
    .sort({ tokenNumber: 1 })
    .limit(limit);

  for (const [index, q] of upcoming.entries()) {
    await notifyUser({
      user: q.user,
      business: businessId,
      queue: q,
      type: index === 0 ? 'turn_coming' : 'position_update',
      templateData: index === 0
        ? { businessName, minutes: Math.max(2, avgServiceTime || 5) }
        : {
            businessName,
            peopleAhead: index,
            waitTime: index * (avgServiceTime || 5),
          },
    });
  }
}

exports.getDashboard = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const { start, end } = getTodayRange();

    const todayQueue = (await Queue.find({
      business: business._id,
      queueDate: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' },
    })
      .populate('user', 'name email')
      .populate('appointment', 'service timeSlot')
      .sort({ tokenNumber: 1 }))
      .map((q) => ({
        ...q.toObject(),
        service: q.appointment?.service || null,
        timeSlot: q.appointment?.timeSlot || null,
      }));

    const stats = {
      total: await Queue.countDocuments({ business: business._id, queueDate: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } }),
      waiting: await Queue.countDocuments({ business: business._id, queueDate: { $gte: start, $lte: end }, status: 'waiting' }),
      completed: await Queue.countDocuments({ business: business._id, queueDate: { $gte: start, $lte: end }, status: 'completed' }),
      skipped: await Queue.countDocuments({ business: business._id, queueDate: { $gte: start, $lte: end }, status: 'skipped' }),
    };

    const todayAppointments = await Appointment.find({
      business: business._id,
      date: { $gte: start, $lte: end },
      status: { $in: ['confirmed', 'checked_in'] },
    })
      .populate('user', 'name email phone')
      .sort({ tokenNumber: 1 });

    res.json({ business, queue: todayQueue, stats, todayAppointments });
  } catch (error) {
    next(error);
  }
};

exports.callNext = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    if (business.approvalStatus !== 'approved') {
      return res.status(403).json({ message: 'Business must be approved before managing the queue' });
    }

    const { start, end } = getTodayRange();

    const nextInQueue = await Queue.findOne({
      business: business._id,
      queueDate: { $gte: start, $lte: end },
      status: 'waiting',
    }).sort({ tokenNumber: 1 });

    if (!nextInQueue) {
      return res.status(404).json({ message: 'No one in queue' });
    }

    nextInQueue.status = 'called';
    nextInQueue.calledAt = new Date();
    await nextInQueue.save();

    const populated = await Queue.findById(nextInQueue._id).populate('user', 'name email phone phoneVerified');

    await notifyUser({
      user: populated.user,
      business,
      queue: populated,
      appointment: populated.appointment,
      type: 'turn_now',
      templateData: {
        businessName: business.name,
        tokenNumber: populated.tokenNumber,
      },
    });
    await notifyUpcomingUsers(business._id, business.name, business.avgServiceTime);

    if (business.queueSettings?.noShowTimeoutMin > 0) {
      const timeoutMs = business.queueSettings.noShowTimeoutMin * 60 * 1000;
      setTimeout(async () => {
        try {
          const entry = await Queue.findById(nextInQueue._id);
          if (entry && entry.status === 'called') {
            entry.status = 'skipped';
            await entry.save();
          }
        } catch (err) {
          console.error('Auto-skip error:', err.message);
        }
      }, timeoutMs);
    }

    res.json({ queue: populated });
  } catch (error) {
    next(error);
  }
};

exports.skipCustomer = async (req, res, next) => {
  try {
    const queue = await Queue.findByIdAndUpdate(
      req.params.id,
      { status: 'skipped' },
      { new: true }
    ).populate('user', 'name email phone phoneVerified');
    if (!queue) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    if (queue.appointment) {
      await Appointment.findByIdAndUpdate(queue.appointment, { status: 'cancelled' });
    }

    const business = await Business.findById(queue.business).select('name avgServiceTime');

    await notifyUser({
      user: queue.user,
      business,
      queue,
      appointment: queue.appointment,
      type: 'cancelled',
      templateData: {
        businessName: business?.name || 'the business',
        tokenNumber: queue.tokenNumber,
      },
    });

    if (business) {
      await notifyUpcomingUsers(business._id, business.name, business.avgServiceTime);
    }

    res.json({ queue });
  } catch (error) {
    next(error);
  }
};

exports.completeAppointment = async (req, res, next) => {
  try {
    const queue = await Queue.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', completedAt: new Date() },
      { new: true }
    ).populate('user', 'name email phone phoneVerified');
    if (!queue) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    if (queue.appointment) {
      await Appointment.findByIdAndUpdate(queue.appointment, { status: 'completed' });
    }

    const business = await Business.findById(queue.business).select('name avgServiceTime');

    await notifyUser({
      user: queue.user,
      business,
      queue,
      appointment: queue.appointment,
      type: 'completed',
      templateData: {
        businessName: business?.name || 'the business',
      },
    });

    if (business) {
      await notifyUpcomingUsers(business._id, business.name, business.avgServiceTime);
    }

    res.json({ queue });
  } catch (error) {
    next(error);
  }
};

exports.addWalkIn = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    if (business.approvalStatus !== 'approved') {
      return res.status(403).json({ message: 'Business must be approved before managing the queue' });
    }

    const { name } = req.body;
    const { start, end } = getTodayRange();

    const tokenNumber = await generateTokenNumber(Queue, business._id);

    const waitingCount = await Queue.countDocuments({
      business: business._id,
      queueDate: { $gte: start, $lte: end },
      status: { $in: ['waiting', 'called'] },
    });

    const queue = await Queue.create({
      business: business._id,
      walkInName: name?.trim() || 'Walk-in',
      tokenNumber,
      queueDate: start,
      status: 'waiting',
      position: waitingCount + 1,
      estimatedWaitTime: calculateWaitTime(waitingCount, business.avgServiceTime),
    });

    res.status(201).json({ queue });
  } catch (error) {
    next(error);
  }
};

exports.businessCheckin = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    if (business.approvalStatus !== 'approved') {
      return res.status(403).json({ message: 'Business must be approved before managing the queue' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.business.toString() !== business._id.toString()) {
      return res.status(403).json({ message: 'This appointment does not belong to your business' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot check in a cancelled appointment' });
    }
    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Appointment already completed' });
    }
    if (appointment.status === 'checked_in') {
      const existingQueue = await Queue.findOne({ appointment: appointment._id });
      if (existingQueue) {
        return res.status(400).json({ message: 'Customer is already in the queue (Token ' + appointment.tokenNumber + ')' });
      }
    }

    const existingQueue = await Queue.findOne({ appointment: appointment._id });
    if (existingQueue) {
      return res.status(400).json({ message: 'Customer already has a queue entry' });
    }

    const { start, end } = getTodayRange();

    const waitingCount = await Queue.countDocuments({
      business: business._id,
      queueDate: { $gte: start, $lte: end },
      status: { $in: ['waiting', 'called'] },
      tokenNumber: { $lt: appointment.tokenNumber },
    });

    const queue = await Queue.create({
      business: business._id,
      user: appointment.user,
      appointment: appointment._id,
      tokenNumber: appointment.tokenNumber,
      queueDate: start,
      status: 'waiting',
      position: waitingCount + 1,
      estimatedWaitTime: calculateWaitTime(waitingCount, business.avgServiceTime),
    });

    appointment.status = 'checked_in';
    await appointment.save();

    const customer = await User.findById(appointment.user).select('name');

    await notifyUser({
      user: customer || { _id: appointment.user },
      business,
      queue,
      appointment: appointment._id,
      type: 'turn_coming',
      templateData: {
        businessName: business.name,
        minutes: business.avgServiceTime || 5,
      },
    });

    emitToBusiness(business._id, 'queue-refresh', { refresh: true, timestamp: new Date() });

    res.json({ appointment, queue });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    res.json({ business });
  } catch (error) {
    next(error);
  }
};

exports.createOrUpdateProfile = async (req, res, next) => {
  try {
    const { name, description, category, address, phone, email, services, timeSlots, openingHours, avgServiceTime, location, queueSettings } = req.body;

    const derivedTimeSlots = Array.isArray(openingHours) && openingHours.length > 0
      ? (() => {
          const firstOpen = openingHours.find((h) => h && !h.closed && h.open && h.close);
          return firstOpen ? { open: firstOpen.open, close: firstOpen.close, interval: timeSlots?.interval || 30 } : undefined;
        })()
      : undefined;

    let business = await Business.findOne({ owner: req.user._id });

    if (business) {
      business.name = name || business.name;
      business.description = description ?? business.description;
      business.category = category || business.category;
      business.address = address ?? business.address;
      business.phone = phone ?? business.phone;
      business.email = email ?? business.email;
      business.avgServiceTime = avgServiceTime ?? business.avgServiceTime;
      if (services) business.services = services;
      if (timeSlots) business.timeSlots = timeSlots;
      if (derivedTimeSlots) business.timeSlots = { ...business.timeSlots, ...derivedTimeSlots };
      if (openingHours) business.openingHours = openingHours;
      if (location) business.location = location;
      if (queueSettings) business.queueSettings = { ...business.queueSettings, ...queueSettings };
      await business.save();
      return res.json({ business, message: 'Business updated' });
    }

    business = await Business.create({
      owner: req.user._id,
      name, description, category, address, phone, email,
      services: services || [],
      timeSlots: timeSlots || derivedTimeSlots || { open: '09:00', close: '17:00', interval: 30 },
      openingHours: openingHours || [],
      avgServiceTime: avgServiceTime || 5,
      location: location || { type: 'Point', coordinates: [0, 0] },
      queueSettings: queueSettings || { tokenPrefix: 'Q', maxDailyTokens: 100, autoAssignToken: true, maxQueuePerCustomer: 1 },
      approvalStatus: 'pending',
    });

    res.status(201).json({ business, message: 'Business created' });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyData = await Queue.aggregate([
      {
        $match: {
          business: business._id,
          queueDate: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$queueDate' } },
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ analytics: weeklyData });
  } catch (error) {
    next(error);
  }
};
