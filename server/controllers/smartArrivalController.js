const Queue = require('../models/Queue');
const Business = require('../models/Business');
const { getTodayRange, calculateWaitTime } = require('../utils/helpers');

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getGoogleTravelTime(originLat, originLng, destLat, destLng) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&departure_time=now&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.rows?.[0]?.elements?.[0]?.duration_in_traffic) {
      return Math.ceil(data.rows[0].elements[0].duration_in_traffic.value / 60);
    }
    if (data.rows?.[0]?.elements?.[0]?.duration) {
      return Math.ceil(data.rows[0].elements[0].duration.value / 60);
    }
  } catch {}
  return null;
}

function estimateTravelTime(distanceKm) {
  const avgSpeedKmh = 30;
  return Math.max(5, Math.ceil((distanceKm / avgSpeedKmh) * 60));
}

exports.getRecommendation = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    const { start, end } = getTodayRange();

    const activeQueue = await Queue.findOne({
      user: req.user._id,
      queueDate: { $gte: start, $lte: end },
      status: { $in: ['waiting', 'called'] },
    })
      .populate('business', 'name category address location avgServiceTime')
      .sort({ tokenNumber: 1 });

    if (!activeQueue) {
      return res.json({ active: false });
    }

    const business = activeQueue.business;
    const peopleAhead = await Queue.countDocuments({
      business: business._id,
      queueDate: { $gte: start, $lte: end },
      tokenNumber: { $lt: activeQueue.tokenNumber },
      status: { $in: ['waiting', 'called'] },
    });

    const currentToken = await Queue.findOne({
      business: business._id,
      queueDate: { $gte: start, $lte: end },
      status: 'called',
    }).sort({ calledAt: -1 });

    const avgTime = business.avgServiceTime || 5;
    const estimatedWaitTime = peopleAhead * avgTime;

    let travelTimeMin = null;
    const busLat = business.location?.coordinates?.[1];
    const busLng = business.location?.coordinates?.[0];

    if (lat && lng && busLat && busLng && (busLat !== 0 || busLng !== 0)) {
      const distanceKm = haversineDistance(parseFloat(lat), parseFloat(lng), busLat, busLng);

      const googleTime = await getGoogleTravelTime(
        parseFloat(lat), parseFloat(lng), busLat, busLng
      );

      travelTimeMin = googleTime || estimateTravelTime(distanceKm);
    } else {
      travelTimeMin = null;
    }

    const now = new Date();
    const leaveInMinutes = travelTimeMin !== null
      ? Math.max(0, estimatedWaitTime - travelTimeMin)
      : null;

    let recommendation = 'relax';
    let message = '';
    if (leaveInMinutes !== null) {
      if (leaveInMinutes <= 0) {
        recommendation = 'leave_now';
        message = 'Leave now. Based on your current location and live queue status, you will reach on time.';
      } else if (leaveInMinutes <= 3) {
        recommendation = 'hurry';
        message = 'Get ready! You should leave very soon to avoid missing your turn.';
      } else {
        recommendation = 'relax';
        message = `Relax! You still have approximately ${leaveInMinutes} minutes before you need to leave.`;
      }
    }

    const estimatedLeaveTime = leaveInMinutes !== null
      ? new Date(now.getTime() + leaveInMinutes * 60000)
      : null;

    const estimatedServiceTime = leaveInMinutes !== null
      ? new Date(now.getTime() + (leaveInMinutes + travelTimeMin) * 60000)
      : null;

    res.json({
      active: true,
      queueNumber: activeQueue.tokenNumber,
      status: activeQueue.status,
      businessName: business.name,
      businessAddress: business.address,
      peopleAhead,
      currentToken: currentToken?.tokenNumber || null,
      estimatedWaitTime,
      travelTimeMin,
      leaveInMinutes,
      recommendation,
      message,
      estimatedLeaveTime: estimatedLeaveTime?.toISOString(),
      estimatedServiceTime: estimatedServiceTime?.toISOString(),
      avgServiceTime: avgTime,
      hasLocation: !!(lat && lng && busLat && busLng && (busLat !== 0 || busLng !== 0)),
      hasGoogleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
    });
  } catch (error) {
    next(error);
  }
};
