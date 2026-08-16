const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const { DAY_KEYS } = require('../models/Business');
const { getTodayRange, generateTokenNumber, timeToMinutes } = require('../utils/helpers');
const { notifyUser } = require('../services/notificationService');
const crowdAnalyticsService = require('../services/crowdAnalyticsService');
const { computeQueueState, estimateWaitMinutes } = require('../services/etaService');
const { broadcastQueueRefresh } = require('../socket/queueHandler');

const IST_DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function computeStaffAvailability(staff = []) {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const dayKey = IST_DAY_NAMES[ist.getUTCDay()];
  const nowMin = ist.getUTCHours() * 60 + ist.getUTCMinutes();

  return staff.map((s) => {
    const day = (s && s.availability && s.availability[dayKey]) || {};
    const open = timeToMinutes(day.open || '09:00');
    const close = timeToMinutes(day.close || '17:00');
    const breakStart = timeToMinutes(day.breakStart);
    const breakEnd = timeToMinutes(day.breakEnd);

    let status = 'off';
    if (!s.isActive) {
      status = 'inactive';
    } else if (!day.off && open !== null && close !== null && close > open) {
      if (nowMin >= open && nowMin < close) {
        status = breakStart !== null && breakEnd !== null && nowMin >= breakStart && nowMin < breakEnd
          ? 'break'
          : 'on-duty';
      } else if (nowMin < open) {
        status = 'upcoming';
      }
    }

    return {
      id: s._id,
      name: s.name,
      role: s.role || '',
      isActive: s.isActive,
      dayKey,
      status,
      hours: day.off ? '' : `${day.open || '09:00'}–${day.close || '17:00'}`,
      breakWindow: breakStart !== null && breakEnd !== null ? `${day.breakStart}–${day.breakEnd}` : '',
    };
  });
}

function validateProfile(payload, existing = null) {
  const errors = [];
  const { services, openingHours, staff, location } = payload;
  const name = payload.name !== undefined && payload.name !== null
    ? String(payload.name).trim()
    : (existing?.name || '');
  const category = payload.category !== undefined && payload.category !== null
    ? String(payload.category).trim()
    : (existing?.category || '');

  if (!name) errors.push('Business name is required');
  if (!category) errors.push('Category is required');

  if (Array.isArray(services)) {
    if (services.length === 0) errors.push('Add at least one service');
    const activeCount = services.filter((s) => s && s.isAvailable !== false).length;
    if (activeCount === 0) errors.push('At least one service must be active');
    services.forEach((s, i) => {
      if (!s) return;
      if (!String(s.name || '').trim()) errors.push(`Service #${i + 1}: name is required`);
      if (typeof s.price === 'number' && s.price < 0) errors.push(`Service "${s.name}": price cannot be negative`);
      if (typeof s.duration === 'number' && s.duration <= 0) errors.push(`Service "${s.name}": duration must be greater than 0`);
    });
  }

  if (Array.isArray(openingHours)) {
    openingHours.forEach((h) => {
      if (!h || h.closed) return;
      if (h.open && h.close) {
        const o = timeToMinutes(h.open);
        const c = timeToMinutes(h.close);
        if (o === null || c === null || c <= o) {
          errors.push(`${h.day || 'Opening hours'}: closing time must be after opening time`);
        }
      }
    });
  }

  if (Array.isArray(staff)) {
    staff.forEach((s, i) => {
      if (!String(s?.name || '').trim()) errors.push(`Staff #${i + 1}: name is required`);
      const availability = s?.availability || {};
      for (const day of DAY_KEYS) {
        const d = availability[day];
        if (d && !d.off && d.open && d.close) {
          const o = timeToMinutes(d.open);
          const c = timeToMinutes(d.close);
          if (o === null || c === null || c <= o) {
            errors.push(`Staff "${s?.name || `#${i + 1}`}" ${day}: closing time must be after opening time`);
          }
          const breakStart = d.breakStart ? timeToMinutes(d.breakStart) : null;
          const breakEnd = d.breakEnd ? timeToMinutes(d.breakEnd) : null;
          if (breakStart !== null || breakEnd !== null) {
            if (breakStart === null || breakEnd === null) {
              errors.push(`Staff "${s?.name || `#${i + 1}`}" ${day}: both break start and end are required`);
            } else if (breakEnd <= breakStart) {
              errors.push(`Staff "${s?.name || `#${i + 1}`}" ${day}: break end must be after break start`);
            } else if (breakStart < o || breakEnd > c) {
              errors.push(`Staff "${s?.name || `#${i + 1}`}" ${day}: break must be within opening hours`);
            }
          }
        }
      }
    });
  }

  if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    const [lng, lat] = location.coordinates;
    if (typeof lng === 'number' && typeof lat === 'number') {
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        errors.push('Location coordinates are invalid');
      }
    }
  }

  return errors;
}

function normalizeServices(business, ids) {
  const valid = new Set((business.services || []).map((s) => String(s._id)));
  return (ids || [])
    .map((id) => String(id))
    .filter((id) => valid.has(id))
    .map((id) => new mongoose.Types.ObjectId(id));
}

function findBusinessOr404(res, business) {
  if (!business) {
    res.status(404).json({ message: 'Business not found' });
    return false;
  }
  return true;
}

async function notifyUpcomingUsers(businessId, businessName, avgServiceTime, limit = 2) {
  const { start, end } = getTodayRange();
  const upcoming = await Queue.find({
    business: businessId,
    queueDate: { $gte: start, $lte: end },
    status: 'waiting',
  })
    .populate('user', 'name email phone phoneVerified')
    .sort({ tokenNumber: 1 })
    .limit(limit);

  const avg = Number(avgServiceTime) > 0 ? Number(avgServiceTime) : null;

  for (const [index, q] of upcoming.entries()) {
    const isNext = index === 0;
    const isSecond = index === 1;
    await notifyUser({
      user: q.user,
      business: businessId,
      queue: q,
      type: isNext ? 'turn_coming' : isSecond ? 'one_ahead' : 'position_update',
      templateData: isNext
        ? { businessName, minutes: avg }
        : {
            businessName,
            peopleAhead: index,
            waitTime: avg !== null ? index * avg : null,
          },
    });
  }
}

exports.getDashboard = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const { start, end } = getTodayRange();

    const todayQueue = (await Queue.find({
      business: business._id,
      queueDate: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' },
    })
      .populate('user', 'name email')
      .populate('appointment', 'service timeSlot amount advanceAmount paymentMethod paidAt paymentTransactionId staffName status paymentStatus paymentInitiatedAt checkedInAt')
      .sort({ tokenNumber: 1 }))
      .map((q) => {
        const appt = q.appointment;
        const rawStatus = appt?.paymentStatus;
        const paymentStatus = rawStatus === 'paid'
          ? 'paid'
          : rawStatus === 'pending'
            ? 'pending'
            : rawStatus === 'failed'
              ? 'failed'
              : null;
        const appointmentAmount = rawStatus === 'paid'
          ? Number(appt.amount) || 0
          : rawStatus === 'pending'
            ? Number(appt.advanceAmount) || 0
            : 0;
        return {
          ...q.toObject(),
          service: appt?.service || null,
          timeSlot: appt?.timeSlot || null,
          staffName: appt?.staffName || null,
          checkedInAt: appt?.checkedInAt || q.createdAt || null,
          appointmentAmount,
          paymentMethod: appt?.paymentMethod || null,
          paidAt: appt?.paidAt || null,
          paymentTransactionId: appt?.paymentTransactionId || null,
          paymentInitiatedAt: appt?.paymentInitiatedAt || null,
          appointmentStatus: appt?.status || null,
          paymentStatus,
        };
      });

    const liveState = await computeQueueState(business._id);
    const etaMap = new Map((liveState.queue || []).map((e) => [String(e.queueId), e]));
    for (const entry of todayQueue) {
      const live = etaMap.get(String(entry._id));
      if (live) {
        entry.position = live.position;
        entry.peopleAhead = live.peopleAhead;
        entry.estimatedWaitTime = live.etaMinutes;
        entry.beingServedCount = live.beingServedCount;
        entry.waitingCount = live.waitingCount;
        entry.activeStaff = live.activeStaff;
        entry.currentToken = live.currentToken;
      } else if (['waiting', 'called'].includes(entry.status)) {
        entry.position = entry.position || todayQueue.indexOf(entry) + 1;
        entry.peopleAhead = Math.max(0, (entry.position || 1) - 1);
      }
    }
    const liveSummary = {
      waiting: liveState.waiting,
      beingServed: liveState.beingServed,
      currentToken: liveState.currentToken,
      activeStaff: liveState.activeStaff,
      isOpen: liveState.isOpen,
      computedAt: liveState.computedAt,
    };

    const stats = {
      total: await Queue.countDocuments({ business: business._id, queueDate: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } }),
      waiting: await Queue.countDocuments({ business: business._id, queueDate: { $gte: start, $lte: end }, status: 'waiting' }),
      completed: await Queue.countDocuments({ business: business._id, queueDate: { $gte: start, $lte: end }, status: 'completed' }),
      skipped: await Queue.countDocuments({ business: business._id, queueDate: { $gte: start, $lte: end }, status: 'skipped' }),
    };

    const paidEntries = todayQueue.filter((q) => q.paymentStatus === 'paid');
    const paymentSummary = {
      totalCollected: paidEntries.reduce((sum, q) => sum + (Number(q.appointmentAmount) || 0), 0),
      paidCount: paidEntries.length,
      pendingCount: todayQueue.filter((q) => q.paymentStatus === 'pending').length,
    };

    const pendingVerifications = await Appointment.find({
      business: business._id,
      paymentStatus: 'pending',
      paymentInitiatedAt: { $ne: null },
      status: 'pending',
    })
      .select('user service staffName date timeSlot advanceAmount paymentMethod paymentTransactionId paymentInitiatedAt')
      .populate('user', 'name email phone')
      .sort({ paymentInitiatedAt: -1 })
      .limit(20);

    const upcomingAppointments = await Appointment.find({
      business: business._id,
      date: { $gte: start, $lte: end },
      status: { $in: ['scheduled', 'pending', 'confirmed'] },
    })
      .select('user service staffName timeSlot expectedStartTime expectedEndTime arrivalWindowStart arrivalDeadline bookingType paymentStatus advanceAmount amount date notes')
      .populate('user', 'name email phone')
      .sort({ timeSlot: 1 });

    const now = new Date();
    const upcomingAppointmentsMeta = upcomingAppointments.map((a) => {
      const obj = a.toObject();
      obj.late = Boolean(a.arrivalDeadline && now > a.arrivalDeadline);
      obj.payment = {
        paid: a.paymentStatus === 'paid',
        pending: a.paymentStatus === 'pending' || a.paymentStatus === 'failed',
        amount: a.paymentStatus === 'paid' ? Number(a.amount) || 0 : Number(a.advanceAmount) || 0,
      };
      return obj;
    });

    res.json({
      business,
      queue: todayQueue,
      stats,
      paymentSummary,
      staffAvailability: computeStaffAvailability(business.staff || []),
      pendingVerifications,
      upcomingAppointments: upcomingAppointmentsMeta,
      liveSummary,
    });
  } catch (error) {
    next(error);
  }
};

exports.callNext = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    if (business.approvalStatus !== 'approved') {
      return res.status(403).json({ message: 'Business must be approved before managing the queue' });
    }

    const { start, end } = getTodayRange();

    const nextInQueue = await Queue.findOne({
      business: business._id,
      queueDate: { $gte: start, $lte: end },
      status: 'waiting',
    }).sort({ tokenNumber: 1 });

    if (!nextInQueue) {
      return res.status(404).json({ message: 'No one in queue' });
    }

    if (nextInQueue.status !== 'waiting') {
      return res.status(400).json({ message: 'This customer has already been called' });
    }

    nextInQueue.status = 'called';
    nextInQueue.calledAt = new Date();
    await nextInQueue.save();

    if (nextInQueue.appointment) {
      await Appointment.findByIdAndUpdate(nextInQueue.appointment, { status: 'in_progress' });
    }

    const populated = await Queue.findById(nextInQueue._id).populate('user', 'name email phone phoneVerified');

    await notifyUser({
      user: populated.user,
      business,
      queue: populated,
      appointment: populated.appointment,
      type: 'turn_now',
      templateData: {
        businessName: business.name,
        tokenNumber: populated.tokenNumber,
      },
    });
    await notifyUpcomingUsers(business._id, business.name, business.avgServiceTime);

    if (business.queueSettings?.noShowTimeoutMin > 0) {
      const timeoutMs = business.queueSettings.noShowTimeoutMin * 60 * 1000;
      setTimeout(async () => {
        try {
          const entry = await Queue.findById(nextInQueue._id);
          if (entry && entry.status === 'called') {
            entry.status = 'skipped';
            await entry.save();
            if (entry.appointment) {
              await Appointment.findByIdAndUpdate(entry.appointment, { status: 'no_show' });
            }
            await broadcastQueueRefresh(business._id);
          }
        } catch (err) {
          console.error('Auto-skip error:', err.message);
        }
      }, timeoutMs);
    }

    await broadcastQueueRefresh(business._id);

    res.json({ queue: populated });
  } catch (error) {
    next(error);
  }
};

exports.skipCustomer = async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.id);
    if (!queue) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    const business = await Business.findById(queue.business).select('name avgServiceTime owner');
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    if (String(business.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    queue.status = 'skipped';
    await queue.save();
    await queue.populate('user', 'name email phone phoneVerified');

    if (queue.appointment) {
      await Appointment.findByIdAndUpdate(queue.appointment, { status: 'no_show' });
    }

    await notifyUser({
      user: queue.user,
      business,
      queue,
      appointment: queue.appointment,
      type: 'cancelled',
      templateData: {
        businessName: business?.name || 'the business',
        tokenNumber: queue.tokenNumber,
      },
    });

    if (business) {
      await notifyUpcomingUsers(business._id, business.name, business.avgServiceTime);
      await broadcastQueueRefresh(business._id);
    }

    res.json({ queue });
  } catch (error) {
    next(error);
  }
};

exports.completeAppointment = async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.id);
    if (!queue) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    const business = await Business.findById(queue.business).select('name avgServiceTime owner payments services');
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    if (String(business.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Completion only needs a simple Paid / Unpaid decision. No transaction ID.
    const paid = req.body && (req.body.paid === true || String(req.body.paid).toLowerCase() === 'paid');

    if (queue.appointment) {
      const appointment = await Appointment.findById(queue.appointment);
      if (appointment) {
        if (paid) {
          const matchedService = (business.services || []).find(
            (s) => s && String(s.name).trim().toLowerCase() === String(appointment.service || '').trim().toLowerCase()
          );
          const price = matchedService && Number(matchedService.price) > 0
            ? Number(matchedService.price)
            : (Number(appointment.amount) > 0 ? Number(appointment.amount) : 0);
          appointment.paymentStatus = 'paid';
          appointment.amount = price;
          appointment.paidAt = new Date();
          if (!appointment.paymentMethod) appointment.paymentMethod = 'pay_at_business';
        } else if (appointment.paymentStatus !== 'paid') {
          appointment.paymentStatus = 'pending';
        }
        appointment.status = 'completed';
        await appointment.save();
      }
    }

    queue.status = 'completed';
    queue.completedAt = new Date();
    await queue.save();
    await queue.populate('user', 'name email phone phoneVerified');

    if (paid) {
      await notifyUser({
        user: queue.user,
        business,
        queue,
        appointment: queue.appointment,
        type: 'payment_received',
        templateData: {
          businessName: business?.name || 'the business',
          amount: 0,
          tokenNumber: queue.tokenNumber,
        },
      });
    }

    await notifyUser({
      user: queue.user,
      business,
      queue,
      appointment: queue.appointment,
      type: 'completed',
      templateData: {
        businessName: business?.name || 'the business',
      },
    });

    if (business) {
      await notifyUpcomingUsers(business._id, business.name, business.avgServiceTime);
      await broadcastQueueRefresh(business._id);
    }

    res.json({ queue, paid });
  } catch (error) {
    next(error);
  }
};

exports.addWalkIn = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    if (business.approvalStatus !== 'approved') {
      return res.status(403).json({ message: 'Business must be approved before managing the queue' });
    }

    const { name } = req.body;
    const { start, end } = getTodayRange();

    const tokenNumber = await generateTokenNumber(Queue, business._id);

    const waitingCount = await Queue.countDocuments({
      business: business._id,
      queueDate: { $gte: start, $lte: end },
      status: { $in: ['waiting', 'called'] },
    });

    const queue = await Queue.create({
      business: business._id,
      walkInName: name?.trim() || 'Walk-in',
      tokenNumber,
      queueDate: start,
      status: 'waiting',
      position: waitingCount + 1,
      estimatedWaitTime: estimateWaitMinutes(waitingCount, business),
    });

    await broadcastQueueRefresh(business._id);

    res.status(201).json({ queue });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    res.json({ business });
  } catch (error) {
    next(error);
  }
};

exports.createOrUpdateProfile = async (req, res, next) => {
  try {
    const {
      name, description, category, subcategory, address, city, state, pincode,
      website, logo, coverImage, phone, email, services, timeSlots, openingHours,
      avgServiceTime, location,       queueSettings, payments, staff, businessStatus,
      appointmentSettings,
    } = req.body;

    let business = await Business.findOne({ owner: req.user._id });

    const errors = validateProfile(req.body, business);
    if (!business && (!Array.isArray(services) || services.length === 0)) {
      errors.push('Add at least one service');
    } else if (!business && !services.some((s) => s && s.isAvailable !== false)) {
      errors.push('At least one service must be active');
    }
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('. ') });
    }

    const derivedTimeSlots = Array.isArray(openingHours) && openingHours.length > 0
      ? (() => {
          const firstOpen = openingHours.find((h) => h && !h.closed && h.open && h.close);
          return firstOpen ? { open: firstOpen.open, close: firstOpen.close, interval: timeSlots?.interval || 30 } : undefined;
        })()
      : undefined;

    if (business) {
      business.name = name || business.name;
      business.description = description ?? business.description;
      business.category = category || business.category;
      business.subcategory = subcategory ?? business.subcategory;
      business.address = address ?? business.address;
      business.city = city ?? business.city;
      business.state = state ?? business.state;
      business.pincode = pincode ?? business.pincode;
      business.website = website ?? business.website;
      business.logo = logo ?? business.logo;
      business.coverImage = coverImage ?? business.coverImage;
      business.phone = phone ?? business.phone;
      business.email = email ?? business.email;
      business.avgServiceTime = avgServiceTime ?? business.avgServiceTime;
      if (services) business.services = services;
      if (staff) business.staff = staff;
      if (payments) business.payments = { ...business.payments, ...payments };
      if (businessStatus) business.businessStatus = businessStatus;
      if (timeSlots) business.timeSlots = timeSlots;
      if (derivedTimeSlots) business.timeSlots = { ...business.timeSlots, ...derivedTimeSlots };
      if (openingHours) business.openingHours = openingHours;
      if (location) business.location = location;
      if (queueSettings) business.queueSettings = { ...business.queueSettings, ...queueSettings };
      if (appointmentSettings) business.appointmentSettings = { ...business.appointmentSettings, ...appointmentSettings };
      await business.save();
      return res.json({ business, message: 'Business updated' });
    }

    const locationField =
      location?.coordinates &&
      Number.isFinite(Number(location.coordinates[0])) &&
      Number.isFinite(Number(location.coordinates[1]))
        ? location
        : undefined;

    business = await Business.create({
      owner: req.user._id,
      name, description, category, subcategory, address, city, state, pincode,
      website, logo, coverImage, phone, email,
      services: services || [],
      staff: staff || [],
      payments: payments || { requirePayment: false, advanceAmount: 0, paymentMode: 'both', upiId: '', paymentQr: '' },
      businessStatus: businessStatus || 'active',
      timeSlots: timeSlots || derivedTimeSlots,
      openingHours: openingHours || [],
      avgServiceTime: Number(avgServiceTime) > 0 ? Number(avgServiceTime) : undefined,
      location: locationField,
      queueSettings: queueSettings || { tokenPrefix: 'Q', maxDailyTokens: 100, autoAssignToken: true, maxQueuePerCustomer: 1 },
      approvalStatus: 'pending',
    });

    res.status(201).json({ business, message: 'Business created' });
  } catch (error) {
    next(error);
  }
};

exports.addService = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!findBusinessOr404(res, business)) return;

    const { name, price, duration, description, isAvailable } = req.body;
    const errors = validateProfile({ services: [{ name, price, duration }] }, business);
    if (errors.length > 0) return res.status(400).json({ message: errors.join('. ') });

    business.services.push({
      name: String(name).trim(),
      price: Number(price) || 0,
      duration: Number(duration) || 30,
      description: description || '',
      isAvailable: isAvailable !== false,
    });
    await business.save();
    res.status(201).json({ business });
  } catch (error) {
    next(error);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!findBusinessOr404(res, business)) return;

    const service = (business.services || []).find((s) => String(s._id) === String(req.params.serviceId));
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const { name, price, duration, description, isAvailable } = req.body;
    if (name !== undefined) service.name = String(name).trim();
    if (price !== undefined) service.price = Number(price) || 0;
    if (duration !== undefined) service.duration = Number(duration) || 30;
    if (description !== undefined) service.description = description;
    if (isAvailable !== undefined) service.isAvailable = Boolean(isAvailable);

    const errors = validateProfile({ services: business.services }, business);
    if (errors.length > 0) return res.status(400).json({ message: errors.join('. ') });

    await business.save();
    res.json({ business });
  } catch (error) {
    next(error);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!findBusinessOr404(res, business)) return;

    const before = business.services.length;
    business.services = (business.services || []).filter((s) => String(s._id) !== String(req.params.serviceId));
    if (business.services.length === before) {
      return res.status(404).json({ message: 'Service not found' });
    }

    for (const member of business.staff || []) {
      member.services = (member.services || []).filter(
        (id) => String(id) !== String(req.params.serviceId)
      );
    }

    await business.save();
    res.json({ business });
  } catch (error) {
    next(error);
  }
};

exports.addStaff = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!findBusinessOr404(res, business)) return;

    const { name, image, role, phone, services, isActive, availability } = req.body;
    const errors = validateProfile({ staff: [{ name, availability }] }, business);
    if (errors.length > 0) return res.status(400).json({ message: errors.join('. ') });

    business.staff.push({
      name: String(name).trim(),
      image: image || '',
      role: role || '',
      phone: phone || '',
      services: normalizeServices(business, services),
      isActive: isActive !== false,
      availability: availability || {},
    });
    await business.save();
    res.status(201).json({ business });
  } catch (error) {
    next(error);
  }
};

exports.updateStaff = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!findBusinessOr404(res, business)) return;

    const member = (business.staff || []).find((s) => String(s._id) === String(req.params.staffId));
    if (!member) return res.status(404).json({ message: 'Staff member not found' });

    const { name, image, role, phone, services, isActive, availability } = req.body;
    if (name !== undefined) member.name = String(name).trim();
    if (image !== undefined) member.image = image;
    if (role !== undefined) member.role = role;
    if (phone !== undefined) member.phone = phone;
    if (services !== undefined) member.services = normalizeServices(business, services);
    if (isActive !== undefined) member.isActive = Boolean(isActive);
    if (availability !== undefined) member.availability = availability;

    const errors = validateProfile({ staff: business.staff }, business);
    if (errors.length > 0) return res.status(400).json({ message: errors.join('. ') });

    await business.save();
    res.json({ business });
  } catch (error) {
    next(error);
  }
};

exports.deleteStaff = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!findBusinessOr404(res, business)) return;

    const before = business.staff.length;
    business.staff = (business.staff || []).filter((s) => String(s._id) !== String(req.params.staffId));
    if (business.staff.length === before) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    await business.save();
    res.json({ business });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyData = await Queue.aggregate([
      {
        $match: {
          business: business._id,
          queueDate: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$queueDate' } },
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ analytics: weeklyData });
  } catch (error) {
    next(error);
  }
};

exports.getCrowdAnalytics = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    const analytics = await crowdAnalyticsService.getCrowdAnalytics(business);
    res.json({ businessId: business._id, businessName: business.name, ...analytics });
  } catch (error) {
    next(error);
  }
};
