/**
 * QueueBook — Smart Recommendation Service (Development convenience ranking).
 *
 * This is NOT a medical or safety-critical recommendation. It only ranks
 * nearby businesses offering the same service using a weighted scoring model.
 *
 * Higher score = better recommendation for the customer.
 */

const WEIGHTS = {
  price: 0.2, // 20% — cheaper is better
  queue: 0.25, // 25% — smaller queue is better
  wait: 0.25, // 25% — shorter estimated wait is better
  distance: 0.15, // 15% — closer is better
  rating: 0.1, // 10% — higher rating is better
  availability: 0.05, // 5% — more available slots is better
};

const normalize = (value, min, max) => {
  const denom = Math.max(max - min, 1e-9);
  return Math.max(0, Math.min(1, (value - min) / denom));
};

const isKnownPrice = (price) => typeof price === 'number' && price > 0;
const isKnownNumber = (n) => typeof n === 'number' && !Number.isNaN(n);

/**
 * Build per-business scores + dynamic reasons.
 *
 * Each entry must look like:
 * {
 *   businessId,
 *   price,                    // number > 0 or null/undefined
 *   queueSize,                // people currently waiting
 *   estimatedWaitTime,        // minutes
 *   distanceKm,               // number or null
 *   rating,                   // 0..5 or 0 when unknown
 *   reviewCount,              // number
 *   availableSlots,           // number (>= 0)
 *   name                      // display name (optional)
 * }
 *
 * Returns { results, hasEnoughData, top }
 */
function buildRecommendations(inputResults) {
  const results = Array.isArray(inputResults) ? inputResults : [];
  if (results.length === 0) {
    return { results: [], hasEnoughData: false, top: null };
  }

  const prices = results.map((r) => (isKnownPrice(r.price) ? r.price : null)).filter((p) => p !== null);
  const queues = results.map((r) => (isKnownNumber(r.queueSize) ? r.queueSize : null)).filter((q) => q !== null);
  const waits = results.map((r) => (isKnownNumber(r.estimatedWaitTime) ? r.estimatedWaitTime : null)).filter((w) => w !== null);
  const distances = results.map((r) => (isKnownNumber(r.distanceKm) ? r.distanceKm : null)).filter((d) => d !== null);
  const ratings = results.map((r) => (isKnownNumber(r.rating) && r.rating > 0 ? r.rating : null)).filter((x) => x !== null);
  const slots = results.map((r) => (isKnownNumber(r.availableSlots) ? r.availableSlots : null)).filter((s) => s !== null);

  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const minQueue = queues.length ? Math.min(...queues) : null;
  const maxQueue = queues.length ? Math.max(...queues) : null;
  const minWait = waits.length ? Math.min(...waits) : null;
  const maxWait = waits.length ? Math.max(...waits) : null;
  const minDist = distances.length ? Math.min(...distances) : null;
  const maxDist = distances.length ? Math.max(...distances) : null;
  const maxRating = ratings.length ? Math.max(...ratings) : null;
  const maxSlots = slots.length ? Math.max(...slots) : null;

  const scored = results.map((r) => {
    const priceKnown = isKnownPrice(r.price);
    const queueKnown = isKnownNumber(r.queueSize);
    const waitKnown = isKnownNumber(r.estimatedWaitTime);
    const distKnown = isKnownNumber(r.distanceKm);
    const ratingKnown = isKnownNumber(r.rating) && r.rating > 0;
    const slotsKnown = isKnownNumber(r.availableSlots);

    const priceScore = priceKnown && minPrice !== null && maxPrice !== null
      ? 1 - normalize(r.price, minPrice, maxPrice)
      : 0.5;

    const queueScore = queueKnown && minQueue !== null && maxQueue !== null
      ? 1 - normalize(r.queueSize, minQueue, maxQueue)
      : 0.5;

    const waitScore = waitKnown && minWait !== null && maxWait !== null
      ? 1 - normalize(r.estimatedWaitTime, minWait, maxWait)
      : 0.5;

    const distanceScore = distKnown && minDist !== null && maxDist !== null
      ? 1 - normalize(r.distanceKm, minDist, maxDist)
      : 0.5;

    const ratingScore = ratingKnown && maxRating !== null
      ? normalize(r.rating, 0, 5)
      : 0.5;

    const availabilityScore = slotsKnown && maxSlots !== null && maxSlots > 0
      ? normalize(r.availableSlots, 0, maxSlots)
      : 0.5;

    const score = Math.round(
      (priceScore * WEIGHTS.price) +
      (queueScore * WEIGHTS.queue) +
      (waitScore * WEIGHTS.wait) +
      (distanceScore * WEIGHTS.distance) +
      (ratingScore * WEIGHTS.rating) +
      (availabilityScore * WEIGHTS.availability)
    ) * 100;

    const reasons = buildReasons(r, {
      minPrice, maxPrice, minQueue, maxQueue, minWait, maxWait,
      minDist, maxDist, maxRating, maxSlots,
      priceKnown, queueKnown, waitKnown, distKnown, ratingKnown, slotsKnown,
    });

    return { ...r, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score);

  // Data sufficiency: require at least 2 businesses and a reasonable amount
  // of real comparison data (price or queue+wait present for most of them).
  const comparable = results.filter((r) =>
    isKnownPrice(r.price) || (isKnownNumber(r.queueSize) && isKnownNumber(r.estimatedWaitTime))
  ).length;
  const coverage = results.length ? comparable / results.length : 0;
  const hasEnoughData = results.length >= 2 && coverage >= 0.5;

  const top = hasEnoughData && scored.length > 0 ? scored[0] : null;

  return { results: scored, hasEnoughData, top };
}

function buildReasons(r, ctx) {
  const reasons = [];

  if (ctx.priceKnown && ctx.minPrice !== null && r.price === ctx.minPrice) {
    reasons.push(`Lowest price ₹${r.price}`);
  }
  if (ctx.queueKnown && ctx.minQueue !== null && r.queueSize === ctx.minQueue) {
    reasons.push(r.queueSize === 0 ? 'No one waiting right now' : `Only ${r.queueSize} people waiting`);
  }
  if (ctx.waitKnown && ctx.minWait !== null && r.estimatedWaitTime === ctx.minWait) {
    reasons.push(`Lowest estimated waiting time (${r.estimatedWaitTime} min)`);
  }
  if (ctx.distKnown && ctx.minDist !== null && r.distanceKm === ctx.minDist) {
    const dist = Number(r.distanceKm).toFixed(1);
    reasons.push(`Closest option (${dist} km)`);
  }
  if (ctx.ratingKnown && ctx.maxRating !== null && r.rating === ctx.maxRating) {
    reasons.push(`Highest rated (${r.rating}★)`);
  }
  if (ctx.slotsKnown && ctx.maxSlots !== null && ctx.maxSlots > 0 && r.availableSlots === ctx.maxSlots) {
    reasons.push(`Most slots available today (${r.availableSlots})`);
  }

  return reasons.slice(0, 4);
}

module.exports = { buildRecommendations, WEIGHTS };
