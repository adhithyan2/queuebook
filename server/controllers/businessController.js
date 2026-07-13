const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const { generateTokenNumber, calculateWaitTime } = require('../utils/helpers');

exports.getDashboard = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayQueue = await Queue.find({
      business: business._id,
      createdAt: { $gte: today },
    }).populate('user', 'name email').sort({ tokenNumber: 1 });

    const stats = {
      total: await Queue.countDocuments({ business: business._id, createdAt: { $gte: today } }),
      waiting: await Queue.countDocuments({ business: business._id, status: 'waiting', createdAt: { $gte: today } }),
      completed: await Queue.countDocuments({ business: business._id, status: 'completed', createdAt: { $gte: today } }),
      skipped: await Queue.countDocuments({ business: business._id, status: 'skipped', createdAt: { $gte: today } }),
    };

    res.json({ business, queue: todayQueue, stats });
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

    const nextInQueue = await Queue.findOne({
      business: business._id,
      status: 'waiting',
    }).sort({ tokenNumber: 1 });

    if (!nextInQueue) {
      return res.status(404).json({ message: 'No one in queue' });
    }

    nextInQueue.status = 'called';
    nextInQueue.calledAt = new Date();
    await nextInQueue.save();

    const populated = await Queue.findById(nextInQueue._id).populate('user', 'name email');

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
    );
    if (!queue) {
      return res.status(404).json({ message: 'Queue entry not found' });
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
    );
    if (!queue) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    if (queue.appointment) {
      await Appointment.findByIdAndUpdate(queue.appointment, { status: 'completed' });
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

    const { name } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await Queue.countDocuments({
      business: business._id,
      createdAt: { $gte: today },
    });

    const tokenNumber = todayCount + 1;

    const waitingCount = await Queue.countDocuments({
      business: business._id,
      status: { $in: ['waiting', 'called'] },
    });

    const queue = await Queue.create({
      business: business._id,
      walkInName: name?.trim() || 'Walk-in',
      tokenNumber,
      status: 'waiting',
      position: waitingCount + 1,
      estimatedWaitTime: calculateWaitTime(waitingCount, business.avgServiceTime),
    });

    res.status(201).json({ queue });
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
    const { name, description, category, address, phone, email, services, timeSlots, avgServiceTime, location, queueSettings } = req.body;

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
      if (location) business.location = location;
      if (queueSettings) business.queueSettings = { ...business.queueSettings, ...queueSettings };
      await business.save();
      return res.json({ business, message: 'Business updated' });
    }

    business = await Business.create({
      owner: req.user._id,
      name, description, category, address, phone, email,
      services: services || [],
      timeSlots: timeSlots || { open: '09:00', close: '17:00', interval: 30 },
      avgServiceTime: avgServiceTime || 5,
      location: location || { type: 'Point', coordinates: [0, 0] },
      queueSettings: queueSettings || { tokenPrefix: 'Q', maxDailyTokens: 100, autoAssignToken: true, maxQueuePerCustomer: 1 },
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

    const weeklyData = await Queue.aggregate([
      {
        $match: {
          business: business._id,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
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
