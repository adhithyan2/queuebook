const generateTokenNumber = async (Queue, businessId) => {
  const lastQueue = await Queue.findOne({ business: businessId }).sort({ tokenNumber: -1 });
  return lastQueue ? lastQueue.tokenNumber + 1 : 1;
};

const calculateWaitTime = (position, avgServiceTime = 5) => {
  return position * avgServiceTime;
};

module.exports = { generateTokenNumber, calculateWaitTime };
