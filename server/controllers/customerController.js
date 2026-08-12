const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Business = require('../models/Business');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const User = require('../models/User');
const { getTodayRange } = require('../utils/helpers');

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateTravelTime(distanceKm) {
  const avgSpeedKmh = 30;
  return Math.max(1, Math.ceil((distanceKm / avgSpeedKmh) * 60));
}

function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, location } = req.body;
    const updates = { name, phone, location };
    if (phone && phone !== req.user.phone) {
      updates.phoneVerified = false;
      updates.phoneOtp = '';
      updates.phoneOtpExpires = null;
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
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

exports.getExploreBusinesses = async (req, res, next) => {
  try {
    const { category, search, lat, lng, radius } = req.query;
    const filter = { isActive: true, approvalStatus: 'approved' };
    if (category && category !== 'all') filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    let businesses;
    if (lat && lng) {
      const pipeline = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: 'distance',
            maxDistance: (parseFloat(radius) || 20) * 1000,
            spherical: true,
            query: filter,
          },
        },
        { $limit: 30 },
      ];
      businesses = await Business.aggregate(pipeline);
    } else {
      businesses = await Business.find(filter).sort({ rating: -1 }).limit(30);
    }

    const { start, end } = getTodayRange();
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const enriched = await Promise.all(businesses.map(async (raw) => {
      const b = raw.toObject ? raw.toObject() : raw;
      const waiting = await Queue.countDocuments({
        business: b._id,
        queueDate: { $gte: start, $lte: end },
        status: 'waiting',
      });
      const called = await Queue.countDocuments({
        business: b._id,
        queueDate: { $gte: start, $lte: end },
        status: 'called',
      });
      const currentToken = await Queue.findOne({
        business: b._id,
        queueDate: { $gte: start, $lte: end },
        status: 'called',
      }).sort({ calledAt: -1 });

      const reviewAgg = await Review.aggregate([
        { $match: { business: b._id } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      const averageRating = reviewAgg[0] ? Math.round(reviewAgg[0].avg * 10) / 10 : b.rating || 0;
      const reviewCount = reviewAgg[0]?.count || 0;

      const busLat = b.location?.coordinates?.[1];
      const busLng = b.location?.coordinates?.[0];
      let distanceKm = null;
      if (lat && lng && busLat !== undefined && busLng !== undefined && (busLat !== 0 || busLng !== 0)) {
        distanceKm = haversineDistance(parseFloat(lat), parseFloat(lng), busLat, busLng);
      } else if (b.distance) {
        distanceKm = b.distance / 1000;
      }
      const travelTimeMin = distanceKm !== null ? estimateTravelTime(distanceKm) : null;

      const openMin = timeToMinutes(b.timeSlots?.open);
      const closeMin = timeToMinutes(b.timeSlots?.close);
      const isOpen = openMin !== null && closeMin !== null && nowMin >= openMin && nowMin < closeMin;

      let availableSlots = 0;
      if (openMin !== null && closeMin !== null) {
        const interval = b.timeSlots?.interval || 30;
        const totalSlots = Math.max(0, Math.floor((closeMin - openMin) / interval));
        const booked = await Appointment.countDocuments({
          business: b._id,
          date: { $gte: start, $lte: end },
          status: { $in: ['pending', 'confirmed'] },
        });
        availableSlots = Math.max(0, totalSlots - booked);
      }

      return {
        _id: b._id,
        name: b.name,
        category: b.category,
        address: b.address,
        phone: b.phone,
        rating: b.rating,
        averageRating,
        reviewCount,
        distanceKm: distanceKm !== null ? Math.round(distanceKm * 100) / 100 : null,
        travelTimeMin,
        isOpen,
        openTime: b.timeSlots?.open || null,
        closeTime: b.timeSlots?.close || null,
        availableSlots,
        location: b.location,
        liveQueue: {
          waiting,
          beingServed: called,
          currentToken: currentToken?.tokenNumber || null,
          estimatedWaitTime: waiting * (b.avgServiceTime || 5),
        },
      };
    }));

    const candidates = enriched.filter((b) => b.isOpen);
    const pool = candidates.length > 0 ? candidates : enriched;

    let recommendation = null;
    if (pool.length > 0) {
      const maxWait = Math.max(1, ...pool.map((b) => b.liveQueue.waiting));
      const maxTravel = Math.max(1, ...pool.map((b) => b.travelTimeMin || 30));
      const maxDistance = Math.max(0.001, ...pool.map((b) => b.distanceKm || 0.001));
      const maxSlots = Math.max(1, ...pool.map((b) => b.availableSlots));

      const scored = pool.map((b) => {
        const waitScore = b.liveQueue.waiting / maxWait;
        const travelScore = (b.travelTimeMin || 30) / maxTravel;
        const distanceScore = (b.distanceKm || 0.001) / maxDistance;
        const ratingScore = (5 - b.averageRating) / 5;
        const slotsScore = 1 - b.availableSlots / maxSlots;
        const score = waitScore * 0.3 + travelScore * 0.3 + distanceScore * 0.15 + ratingScore * 0.1 + slotsScore * 0.15;
        return { business: b, score };
      });

      scored.sort((a, b2) => a.score - b2.score);
      const best = scored[0].business;
      const leaveInMinutes = best.travelTimeMin !== null
        ? Math.max(0, best.liveQueue.estimatedWaitTime - best.travelTimeMin)
        : null;

      recommendation = {
        business: best,
        message: `${best.name} — ${best.liveQueue.estimatedWaitTime} min waiting`,
        leaveInMinutes,
        leaveMessage: leaveInMinutes !== null
          ? `Leave in approximately ${leaveInMinutes} minutes to arrive on time.`
          : 'Leave now to arrive on time.',
        reason: 'Optimized for queue size, wait time, distance and availability',
      };
    }

    res.json({ businesses: enriched, recommendation, userLocation: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null });
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
