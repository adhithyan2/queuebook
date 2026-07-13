const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
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
