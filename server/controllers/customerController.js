const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Business = require('../models/Business');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const { getTodayRange } = require('../utils/helpers');

exports.getDashboard = async (req, res, next) => {
  try {
    const { start, end } = getTodayRange();

    const upcomingAppointment = await Appointment.findOne({
      user: req.user._id,
      status: { $in: ['pending', 'confirmed'] },
      date: { $gte: new Date() },
    }).populate('business', 'name category address phone').sort({ date: 1 });

    const activeQueue = await Queue.findOne({
      user: req.user._id,
      queueDate: { $gte: start, $lte: end },
      status: { $in: ['waiting', 'called'] },
    }).populate('business', 'name category').sort({ tokenNumber: 1 });

    let queueStatus = null;
    if (activeQueue) {
      const peopleAhead = await Queue.countDocuments({
        business: activeQueue.business._id,
        queueDate: { $gte: start, $lte: end },
        tokenNumber: { $lt: activeQueue.tokenNumber },
        status: { $in: ['waiting', 'called'] },
      });
      const currentToken = await Queue.findOne({
        business: activeQueue.business._id,
        queueDate: { $gte: start, $lte: end },
        status: 'called',
      }).sort({ calledAt: -1 });
      queueStatus = {
        peopleAhead,
        currentToken: currentToken?.tokenNumber || null,
        estimatedWaitTime: peopleAhead * 5,
      };
    }

    const recentAppointments = await Appointment.find({ user: req.user._id })
      .populate('business', 'name category')
      .sort({ date: -1 })
      .limit(5);

    const unreadNotifications = await Notification.find({ user: req.user._id, read: false })
      .sort({ createdAt: -1 })
      .limit(10);

    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

    const nearbyBusinesses = await Business.find({ isActive: true })
      .limit(6)
      .sort({ rating: -1 });

    res.json({
      upcomingAppointment,
      activeQueue,
      queueStatus,
      recentAppointments,
      unreadNotifications,
      unreadCount,
      nearbyBusinesses,
    });
  } catch (error) {
    next(error);
  }
};

exports.getNearbyBusinesses = async (req, res, next) => {
  try {
    const { category, search, lat, lng, radius } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    let businesses;
    if (lat && lng) {
      const pipeline = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: 'distance',
            maxDistance: (parseFloat(radius) || 10) * 1000,
            spherical: true,
            query: filter,
          },
        },
        { $limit: 20 },
      ];
      businesses = await Business.aggregate(pipeline);
    } else {
      businesses = await Business.find(filter).sort({ rating: -1 }).limit(20);
    }

    res.json({ businesses });
  } catch (error) {
    next(error);
  }
};

exports.getBusinessReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ business: req.params.businessId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};
