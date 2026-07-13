const User = require('../models/User');
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

exports.getBusinesses = async (req, res, next) => {
  try {
    const businesses = await Business.find().populate('owner', 'name email').sort({ createdAt: -1 });
    res.json({ businesses });
  } catch (error) {
    next(error);
  }
};

exports.getReports = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBusinesses = await Business.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const totalQueueEntries = await Queue.countDocuments();

    const appointmentsByStatus = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      reports: {
        totalUsers,
        totalBusinesses,
        totalAppointments,
        totalQueueEntries,
        appointmentsByStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailySignups = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ analytics: { dailySignups } });
  } catch (error) {
    next(error);
  }
};
