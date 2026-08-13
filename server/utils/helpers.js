const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const getTodayRange = () => {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const start = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - IST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
};

const generateTokenNumber = async (Queue, businessId) => {
  const { start, end } = getTodayRange();
  const count = await Queue.countDocuments({
    business: businessId,
    queueDate: { $gte: start, $lte: end },
  });
  return count + 1;
};

const calculateWaitTime = (position, avgServiceTime = 5) => {
  return position * avgServiceTime;
};

module.exports = { getTodayRange, generateTokenNumber, calculateWaitTime };
