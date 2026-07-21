const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const { getTodayRange, generateTokenNumber, calculateWaitTime } = require('../utils/helpers');

exports.joinQueue = async (req, res, next) => {
  try {
    const { business, appointment: appointmentId } = req.body;
    const { start, end } = getTodayRange();
    const tokenNumber = await generateTokenNumber(Queue, business);

    const waitingCount = await Queue.countDocuments({
      business,
      queueDate: { $gte: start, $lte: end },
      status: { $in: ['waiting', 'called'] },
    });

    const queue = await Queue.create({
      business,
      user: req.user._id,
      appointment: appointmentId,
      tokenNumber,
      queueDate: start,
      status: 'waiting',
      position: waitingCount + 1,
      estimatedWaitTime: calculateWaitTime(waitingCount),
    });

    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, { tokenNumber });
    }

    res.status(201).json({ queue });
  } catch (error) {
    next(error);
  }
};

exports.getMyQueue = async (req, res, next) => {
  try {
    const { start, end } = getTodayRange();
    const queues = await Queue.find({
      user: req.user._id,
      queueDate: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' },
    })
      .populate('business', 'name category avgServiceTime')
      .sort({ tokenNumber: 1 });

    const queuesWithPosition = await Promise.all(
      queues.map(async (q) => {
        const peopleAhead = await Queue.countDocuments({
          business: q.business._id,
          queueDate: { $gte: start, $lte: end },
          tokenNumber: { $lt: q.tokenNumber },
          status: { $in: ['waiting', 'called'] },
        });

        const avgTime = q.business?.avgServiceTime || 5;
        const estimatedWaitTime = peopleAhead * avgTime;

        return {
          ...q.toObject(),
          position: peopleAhead + 1,
          peopleAhead,
          estimatedWaitTime,
        };
      })
    );

    res.json({ queues: queuesWithPosition });
  } catch (error) {
    next(error);
  }
};

exports.getQueueStatus = async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.id)
      .populate('business', 'name avgServiceTime');
    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    const { start, end } = getTodayRange();

    const peopleAhead = await Queue.countDocuments({
      business: queue.business,
      queueDate: { $gte: start, $lte: end },
      tokenNumber: { $lt: queue.tokenNumber },
      status: { $in: ['waiting', 'called'] },
    });

    const currentToken = await Queue.findOne({
      business: queue.business,
      queueDate: { $gte: start, $lte: end },
      status: 'called',
    }).sort({ calledAt: -1 });

    res.json({
      queue,
      peopleAhead,
      currentToken: currentToken?.tokenNumber || null,
      estimatedWaitTime: calculateWaitTime(peopleAhead, queue.business?.avgServiceTime || 5),
    });
  } catch (error) {
    next(error);
  }
};

exports.leaveQueue = async (req, res, next) => {
  try {
    const queue = await Queue.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }
    res.json({ queue });
  } catch (error) {
    next(error);
  }
};
