const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const { getTodayRange, generateTokenNumber } = require('../utils/helpers');
const { notifyUser } = require('../services/notificationService');
const { computeQueueState, estimateWaitMinutes } = require('../services/etaService');
const { broadcastQueueRefresh } = require('../socket/queueHandler');

exports.joinQueue = async (req, res, next) => {
  try {
    const { business, appointment: appointmentId } = req.body;
    const { start, end } = getTodayRange();

    if (appointmentId) {
      const existing = await Queue.findOne({
        appointment: appointmentId,
        status: { $in: ['waiting', 'called'] },
      });
      if (existing) {
        return res.status(400).json({ message: 'This booking is already in the live queue' });
      }
    }

    const tokenNumber = await generateTokenNumber(Queue, business);

    const businessDoc = await Business.findById(business).select('name avgServiceTime staff');

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
      estimatedWaitTime: estimateWaitMinutes(waitingCount, businessDoc),
    });

    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, { tokenNumber, status: 'checked_in' });
    }

    await notifyUser({
      user: req.user,
      business: businessDoc,
      queue,
      appointment: appointmentId,
      type: 'booking_confirmed',
      templateData: {
        businessName: businessDoc?.name || 'the business',
        tokenNumber,
        peopleAhead: waitingCount,
        waitTime: estimateWaitMinutes(waitingCount, businessDoc),
      },
    });

    await broadcastQueueRefresh(business);

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
      .populate('business', 'name category avgServiceTime openingHours timeSlots')
      .populate('appointment', 'service timeSlot staffName checkedInAt expectedStartTime expectedEndTime')
      .sort({ tokenNumber: 1 });

    // Use the same ETA engine the business dashboard sees.
    const businessIds = [...new Set(queues.map((q) => String(q.business?._id)).filter(Boolean))];
    const states = await Promise.all(businessIds.map((id) => computeQueueState(id).catch(() => null)));
    const liveByQueue = new Map();
    for (const s of states) {
      if (!s) continue;
      for (const e of s.queue || []) liveByQueue.set(String(e.queueId), e);
    }

    const queuesWithPosition = queues.map((q) => {
      const live = liveByQueue.get(String(q._id));
      const isActive = ['waiting', 'called'].includes(q.status);
      return {
        ...q.toObject(),
        position: live?.position ?? (q.position || null),
        peopleAhead: live?.peopleAhead ?? null,
        estimatedWaitTime: live?.etaMinutes ?? q.estimatedWaitTime,
        currentToken: live?.currentToken ?? null,
        beingServedCount: live?.beingServedCount ?? null,
        activeStaff: live?.activeStaff ?? null,
        isOpen: live?.isOpen ?? null,
        service: q.appointment?.service || null,
        staffName: q.appointment?.staffName || null,
        timeSlot: q.appointment?.timeSlot || null,
        checkedInAt: q.appointment?.checkedInAt || null,
        isActive,
      };
    });

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

    const state = await computeQueueState(queue.business);
    const live = (state.queue || []).find((e) => String(e.queueId) === String(queue._id));

    res.json({
      queue,
      peopleAhead: live?.peopleAhead ?? null,
      currentToken: state.currentToken || null,
      estimatedWaitTime: live?.etaMinutes ?? null,
      isOpen: state.isOpen,
      activeStaff: state.activeStaff,
      beingServed: state.beingServed,
    });
  } catch (error) {
    next(error);
  }
};

exports.getQueueScan = async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.id)
      .populate('business', 'name category address phone avgServiceTime')
      .populate('appointment', 'service timeSlot staffName');

    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    const state = await computeQueueState(queue.business._id);
    const live = (state.queue || []).find((e) => String(e.queueId) === String(queue._id));

    res.json({
      queue: {
        _id: queue._id,
        tokenNumber: queue.tokenNumber,
        status: queue.status,
        businessName: queue.business?.name || 'Business',
        businessCategory: queue.business?.category || '',
        businessAddress: queue.business?.address || '',
        serviceName: queue.appointment?.service || '',
        staffName: queue.appointment?.staffName || '',
        currentToken: state.currentToken || null,
        peopleAhead: live?.peopleAhead ?? null,
        position: live?.position ?? null,
        estimatedWaitTime: live?.etaMinutes ?? null,
        isOpen: state.isOpen,
        lastUpdated: state.computedAt || queue.updatedAt || queue.createdAt,
      },
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

    if (queue.appointment) {
      await Appointment.findByIdAndUpdate(queue.appointment, { status: 'cancelled' });
    }

    const businessDoc = await Business.findById(queue.business).select('name');
    await notifyUser({
      user: req.user,
      business: businessDoc,
      queue,
      appointment: queue.appointment,
      type: 'cancelled',
      templateData: {
        businessName: businessDoc?.name || 'the business',
        tokenNumber: queue.tokenNumber,
      },
    });

    await broadcastQueueRefresh(queue.business);

    res.json({ queue });
  } catch (error) {
    next(error);
  }
};
