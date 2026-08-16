const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Business = require('../models/Business');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const User = require('../models/User');
const {
  getTodayRange,
  timeToMinutes,
  escapeRegExp,
  generateTimeSlots,
  getNextAvailableSlot,
} = require('../utils/helpers');
const { buildRecommendations } = require('../services/recommendationService');
const { getAvailableSlots } = require('../services/availabilityService');
const { activeStaffCount, estimateWaitMinutes } = require('../services/etaService');
const crowdAnalyticsService = require('../services/crowdAnalyticsService');

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

/**
 * Flexible search for Explore / Nearby / Compare.
 * - case-insensitive
 * - punctuation, hyphens & whitespace normalized
 * - partial (substring) matching across business name, description,
 *   category, subcategory and service names/descriptions
 * - multi-keyword: a business matches when ANY keyword matches; results are
 *   then ranked so businesses matching MORE keywords rank first.
 */
function normalizeSearchText(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function searchKeywords(search) {
  return normalizeSearchText(search).split(' ').filter(Boolean);
}

function keywordRegex(keyword) {
  return new RegExp(escapeRegExp(keyword), 'i');
}

function buildSearchFilter(search) {
  const keywords = searchKeywords(search);
  if (keywords.length === 0) return null;
  return {
    $or: keywords.map((kw) => {
      const rx = keywordRegex(kw);
      return {
        $or: [
          { name: rx },
          { description: rx },
          { category: rx },
          { subcategory: rx },
          { 'services.name': rx },
          { 'services.description': rx },
        ],
      };
    }),
  };
}

function bestServiceForKeywords(services, keywords) {
  if (!Array.isArray(services) || services.length === 0) return null;
  let best = null;
  let bestScore = -1;
  for (const s of services) {
    if (!s || s.isAvailable === false) continue;
    const haystack = normalizeSearchText(`${s.name || ''} ${s.description || ''}`);
    let score = 0;
    for (const kw of keywords) {
      if (haystack.includes(kw)) score += 1;
    }
    if (keywords.length > 0 && normalizeSearchText(s.name).startsWith(keywords[0])) score += 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

function relevanceScoreForBusiness(b, keywords) {
  if (keywords.length === 0) return 0;
  let score = 0;
  const name = normalizeSearchText(b.name);
  const category = normalizeSearchText(`${b.category} ${b.subcategory || ''}`);
  const description = normalizeSearchText(b.description);
  for (const kw of keywords) {
    if (name.includes(kw)) score += 3;
    if (category.includes(kw)) score += 2;
    if (description.includes(kw)) score += 0.5;
    for (const s of b.services || []) {
      if (s && normalizeSearchText(s.name).includes(kw)) score += 2;
    }
  }
  return score;
}

function staffForService(business, serviceId) {
  return (business.staff || []).filter(
    (s) => s && s.isActive !== false && (!serviceId || (s.services || []).some((id) => String(id) === String(serviceId)))
  );
}

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, location, vibrationPreference } = req.body;
    const updates = { name, phone, location };
    if (typeof vibrationPreference === 'boolean') {
      updates.vibrationPreference = vibrationPreference;
    }
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
      status: { $in: ['pending', 'confirmed', 'scheduled', 'checked_in'] },
      date: { $gte: start },
    }).populate('business', 'name category address phone').sort({ date: 1 });

    const activeQueue = await Queue.findOne({
      user: req.user._id,
      queueDate: { $gte: start, $lte: end },
      status: { $in: ['waiting', 'called'] },
    }).populate('business', 'name category avgServiceTime staff').sort({ tokenNumber: 1 });

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
        estimatedWaitTime: estimateWaitMinutes(peopleAhead, activeQueue.business),
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
    const searchFilter = buildSearchFilter(search);
    if (searchFilter) Object.assign(filter, searchFilter);

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

    if (search) {
      const keywords = searchKeywords(search);
      businesses.sort((a, b) => relevanceScoreForBusiness(b, keywords) - relevanceScoreForBusiness(a, keywords));
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
    const searchFilter = buildSearchFilter(search);
    if (searchFilter) Object.assign(filter, searchFilter);

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

    const keywords = search ? searchKeywords(search) : [];
    if (keywords.length > 0) {
      businesses.sort((a, b) => relevanceScoreForBusiness(b, keywords) - relevanceScoreForBusiness(a, keywords));
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
      const averageRating = reviewAgg[0] ? Math.round(reviewAgg[0].avg * 10) / 10 : null;
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

      const smartTiming = await crowdAnalyticsService.getCrowdSnapshot(b);

      return {
        _id: b._id,
        name: b.name,
        category: b.category,
        address: b.address,
        phone: b.phone,
        logo: b.logo || '',
        coverImage: b.coverImage || '',
        rating: b.rating,
        averageRating,
        reviewCount,
        distanceKm: distanceKm !== null ? Math.round(distanceKm * 100) / 100 : null,
        travelTimeMin,
        isOpen,
        openTime: b.timeSlots?.open || null,
        closeTime: b.timeSlots?.close || null,
        openingHours: b.openingHours || [],
        availableSlots,
        location: b.location,
        staff: (b.staff || []).map((s) => ({
          _id: s._id,
          name: s.name,
          role: s.role || '',
          image: s.image || '',
          isActive: s.isActive !== false,
          services: (s.services || []).map((id) => String(id)),
        })),
        relevanceScore: keywords.length > 0 ? relevanceScoreForBusiness(b, keywords) : null,
        smartTiming,
        liveQueue: {
          waiting,
          beingServed: called,
          currentToken: currentToken?.tokenNumber || null,
          estimatedWaitTime: (() => {
            const avg = Number(b.avgServiceTime) > 0 ? Number(b.avgServiceTime) : 30;
            return Math.ceil(waiting * avg / Math.max(1, activeStaffCount(b)));
          })(),
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
        const travelScore = (b.travelTimeMin != null ? b.travelTimeMin : 30) / maxTravel;
        const distanceScore = (b.distanceKm != null ? b.distanceKm : 0.001) / maxDistance;
        const avgRating = b.averageRating;
        const ratingScore = Number(avgRating) > 0 ? (5 - avgRating) / 5 : 0.5;
        const slotsScore = 1 - b.availableSlots / maxSlots;
        const score = waitScore * 0.3 + travelScore * 0.3 + distanceScore * 0.15 + ratingScore * 0.1 + slotsScore * 0.15;
        return { business: b, score };
      });

      scored.sort((a, b2) => a.score - b2.score);
      const best = scored[0].business;
      const estimatedWaitTime = best.liveQueue.estimatedWaitTime;
      const waitLabel = estimatedWaitTime != null
        ? `${estimatedWaitTime} min waiting`
        : 'wait time unknown';
      const leaveInMinutes = best.travelTimeMin !== null && estimatedWaitTime != null
        ? Math.max(0, estimatedWaitTime - best.travelTimeMin)
        : null;

      recommendation = {
        business: best,
        message: `${best.name} — ${waitLabel}`,
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

exports.compareServices = async (req, res, next) => {
  try {
    const { service, lat, lng, radius } = req.query;
    if (!service || !String(service).trim()) {
      return res.status(400).json({ message: 'Service name is required' });
    }
    const serviceName = String(service).trim();
    const keywords = searchKeywords(serviceName);
    if (keywords.length === 0) {
      return res.status(400).json({ message: 'Service name is required' });
    }
    const locationProvided = Boolean(lat && lng) &&
      !Number.isNaN(parseFloat(lat)) && !Number.isNaN(parseFloat(lng));

    const searchFilter = buildSearchFilter(serviceName);
    const filter = {
      isActive: true,
      approvalStatus: 'approved',
      'services.isAvailable': { $ne: false },
      ...(searchFilter || { 'services.name': /\w/ }),
    };

    let businesses;
    if (locationProvided) {
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

    if (!businesses.length) {
      return res.json({
        service: serviceName,
        locationProvided,
        results: [],
        recommendation: { top: null, hasEnoughData: false },
        message: `No businesses found offering "${serviceName}" nearby.`,
      });
    }

    const ids = businesses.map((b) => b._id);
    const { start, end } = getTodayRange();

    const queueAgg = await Queue.aggregate([
      { $match: { business: { $in: ids }, queueDate: { $gte: start, $lte: end } } },
      { $group: { _id: { business: '$business', status: '$status' }, n: { $sum: 1 } } },
    ]);
    const waitingMap = {};
    const calledMap = {};
    for (const row of queueAgg) {
      const key = row._id.business.toString();
      if (row._id.status === 'waiting') waitingMap[key] = row.n;
      else if (row._id.status === 'called') calledMap[key] = row.n;
    }

    const calledTokens = await Queue.find({
      business: { $in: ids },
      queueDate: { $gte: start, $lte: end },
      status: 'called',
    }).select('business tokenNumber calledAt').sort({ calledAt: -1 }).lean();
    const currentTokenMap = {};
    for (const c of calledTokens) {
      const key = c.business.toString();
      if (currentTokenMap[key] === undefined) currentTokenMap[key] = c.tokenNumber;
    }

    const reviewAgg = await Review.aggregate([
      { $match: { business: { $in: ids } } },
      { $group: { _id: '$business', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const reviewMap = {};
    for (const row of reviewAgg) reviewMap[row._id.toString()] = row;

    const apptsToday = await Appointment.aggregate([
      {
        $match: {
          business: { $in: ids },
          date: { $gte: start, $lte: end },
          status: { $in: ['pending', 'confirmed'] },
        },
      },
      { $group: { _id: '$business', slots: { $addToSet: '$timeSlot' }, count: { $sum: 1 } } },
    ]);
    const apptsMap = {};
    for (const row of apptsToday) apptsMap[row._id.toString()] = row;

    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

    const results = businesses.map((raw) => {
      const b = raw.toObject ? raw.toObject() : raw;
      const matched = bestServiceForKeywords(b.services || [], keywords);
      const idKey = b._id.toString();
      const waiting = waitingMap[idKey] || 0;
      const review = reviewMap[idKey];
      const avgRating = review ? Math.round(review.avg * 10) / 10 : null;
      const reviewCount = review?.count || 0;

      const busLat = b.location?.coordinates?.[1];
      const busLng = b.location?.coordinates?.[0];
      let distanceKm = null;
      if (locationProvided && busLat !== undefined && busLng !== undefined && (busLat !== 0 || busLng !== 0)) {
        distanceKm = haversineDistance(parseFloat(lat), parseFloat(lng), busLat, busLng);
      } else if (b.distance) {
        distanceKm = b.distance / 1000;
      }
      const travelTimeMin = distanceKm !== null ? estimateTravelTime(distanceKm) : null;

      const openMin = timeToMinutes(b.timeSlots?.open);
      const closeMin = timeToMinutes(b.timeSlots?.close);
      const isOpen = openMin !== null && closeMin !== null && nowMin >= openMin && nowMin < closeMin;

      const bookedSlots = apptsMap[idKey]?.slots || [];
      const bookedCount = apptsMap[idKey]?.count || 0;
      const interval = b.timeSlots?.interval || 30;
      const totalSlots = generateTimeSlots(b.timeSlots?.open, b.timeSlots?.close, interval).length;
      const availableSlots = Math.max(0, totalSlots - bookedCount);
      const nextAvailableSlot = getNextAvailableSlot(
        b.timeSlots?.open,
        b.timeSlots?.close,
        interval,
        nowMin,
        bookedSlots
      );

      const price = matched && typeof matched.price === 'number' && matched.price > 0 ? matched.price : null;
      const availableStaff = staffForService(b, matched?._id);

      return {
        businessId: b._id,
        name: b.name,
        category: b.category,
        description: b.description || '',
        address: b.address,
        city: b.city || '',
        phone: b.phone,
        logo: b.logo || '',
        coverImage: b.coverImage || '',
        serviceName: matched?.name || serviceName,
        price,
        duration: matched?.duration || null,
        rating: avgRating,
        reviewCount,
        distanceKm: distanceKm !== null ? Math.round(distanceKm * 100) / 100 : null,
        travelTimeMin,
        isOpen,
        openTime: b.timeSlots?.open || null,
        closeTime: b.timeSlots?.close || null,
        openingHours: b.openingHours || [],
        queueSize: waiting,
        estimatedWaitTime: (() => {
          const avg = Number(b.avgServiceTime) > 0 ? Number(b.avgServiceTime) : 30;
          return Math.ceil(waiting * avg / Math.max(1, activeStaffCount(b)));
        })(),
        currentToken: currentTokenMap[idKey] || null,
        availableSlots,
        nextAvailableSlot,
        location: b.location,
        staffCount: (b.staff || []).filter((s) => s && s.isActive !== false).length,
        availableStaff: availableStaff.map((s) => ({
          _id: s._id,
          name: s.name,
          role: s.role || '',
          image: s.image || '',
        })),
        business: b,
      };
    });

    const rec = buildRecommendations(
      results.map(({ business: _b, ...rest }) => rest)
    );
    const scoredMap = new Map(rec.results.map((x) => [String(x.businessId), x]));
    const enrichedResults = results.map((r) => {
      const s = scoredMap.get(String(r.businessId));
      return s ? { ...r, score: s.score, reasons: s.reasons } : r;
    });
    const topBusiness = rec.top
      ? enrichedResults.find((r) => String(r.businessId) === String(rec.top.businessId)) || null
      : null;

    res.json({
      service: serviceName,
      locationProvided,
      results: enrichedResults,
      recommendation: { top: topBusiness, hasEnoughData: rec.hasEnoughData },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { business: businessId, date, staff, service } = req.query;
    if (!businessId) return res.status(400).json({ message: 'Business is required' });
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: 'Business not found' });

    let staffDoc = null;
    if (staff) {
      staffDoc = (business.staff || []).find((s) => String(s._id) === String(staff));
      if (!staffDoc) return res.status(404).json({ message: 'Staff member not found' });
    }

    let serviceDuration = null;
    if (service && String(service).trim()) {
      const matched = (business.services || []).find(
        (s) => s && String(s.name).trim().toLowerCase() === String(service).trim().toLowerCase()
      );
      if (matched && Number(matched.duration) > 0) serviceDuration = Number(matched.duration);
    }

    const slots = await getAvailableSlots(
      business,
      String(date).slice(0, 10),
      staffDoc,
      { serviceDuration }
    );
    res.json({
      slots,
      date: String(date).slice(0, 10),
      staff: staffDoc ? { _id: staffDoc._id, name: staffDoc.name } : null,
    });
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
        estimatedWait: estimateWaitMinutes(waiting, business),
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
      .populate('business', 'name avgServiceTime staff')
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
        estimatedWaitTime: estimateWaitMinutes(peopleAhead, queue.business),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCrowdAnalytics = async (req, res, next) => {
  try {
    const business = await Business.findOne({
      _id: req.params.businessId,
      isActive: true,
      approvalStatus: 'approved',
    });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    const analytics = await crowdAnalyticsService.getCrowdAnalytics(business);
    res.json({ businessId: business._id, businessName: business.name, ...analytics });
  } catch (error) {
    next(error);
  }
};

exports.getBestTimes = async (req, res, next) => {
  try {
    const business = await Business.findOne({
      _id: req.params.businessId,
      isActive: true,
      approvalStatus: 'approved',
    });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    const result = await crowdAnalyticsService.buildBestTimes(business);
    res.json({
      businessId: business._id,
      businessName: business.name,
      source: result.source,
      hasCandidates: result.hasCandidates,
      best: result.best,
      avoid: result.avoid,
    });
  } catch (error) {
    next(error);
  }
};

exports.getExpectedQueue = async (req, res, next) => {
  try {
    const business = await Business.findOne({
      _id: req.params.businessId,
      isActive: true,
      approvalStatus: 'approved',
    });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    const { date, time, serviceId, staff } = req.query;
    const result = await crowdAnalyticsService.getExpectedQueue(business, {
      date,
      time,
      serviceId,
      staffId: staff,
    });
    res.json({ businessId: business._id, businessName: business.name, ...result });
  } catch (error) {
    next(error);
  }
};
