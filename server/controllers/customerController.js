const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Business = require('../models/Business');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const User = require('../models/User');
const { getTodayRange } = require('../utils/helpers');

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, location } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, location },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

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

    const nearbyBusinesses = await Business.find({ isActive: true, approvalStatus: 'approved' })
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
    const filter = { isActive: true, approvalStatus: 'approved' };
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

exports.getBusinessPublic = async (req, res, next) => {
  try {
    const business = await Business.findOne({
      _id: req.params.businessId,
      isActive: true,
      approvalStatus: 'approved',
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const { start, end } = getTodayRange();
    const waiting = await Queue.countDocuments({
      business: business._id,
      queueDate: { $gte: start, $lte: end },
      status: 'waiting',
    });
    const called = await Queue.countDocuments({
      business: business._id,
      queueDate: { $gte: start, $lte: end },
      status: 'called',
    });

    const currentToken = await Queue.findOne({
      business: business._id,
      queueDate: { $gte: start, $lte: end },
      status: 'called',
    }).sort({ calledAt: -1 });

    const reviews = await Review.find({ business: business._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      business,
      liveQueue: {
        waiting,
        beingServed: called,
        currentToken: currentToken?.tokenNumber || null,
        estimatedWait: waiting * (business.avgServiceTime || 5),
      },
      recentReviews: reviews,
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyQueueToken = async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.queueId)
      .populate('business', 'name')
      .populate('user', 'name');

    if (!queue) {
      return res.status(404).json({ message: 'Token not found' });
    }

    const { start, end } = getTodayRange();
    const peopleAhead = await Queue.countDocuments({
      business: queue.business._id,
      queueDate: { $gte: start, $lte: end },
      tokenNumber: { $lt: queue.tokenNumber },
      status: { $in: ['waiting', 'called'] },
    });

    res.json({
      queue: {
        _id: queue._id,
        tokenNumber: queue.tokenNumber,
        status: queue.status,
        walkInName: queue.walkInName,
        customerName: queue.user?.name,
        businessName: queue.business?.name,
        position: peopleAhead + 1,
        estimatedWaitTime: peopleAhead * (queue.business?.avgServiceTime || 5),
      },
    });
  } catch (error) {
    next(error);
  }
};
