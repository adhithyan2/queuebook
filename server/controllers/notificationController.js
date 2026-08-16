const Notification = require('../models/Notification');
const MessageLog = require('../models/MessageLog');
const Business = require('../models/Business');
const { sendUserPush } = require('../services/pushService');

exports.registerPushToken = async (req, res, next) => {
  try {
    const { token, platform, deviceName } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Push token is required' });
    }

    const safePlatform = platform === 'web' ? 'web' : 'expo';
    const tokens = req.user.pushTokens || [];
    const existing = tokens.find((t) => t.token === token);

    if (existing) {
      existing.platform = safePlatform;
      existing.deviceName = deviceName || existing.deviceName;
      existing.createdAt = new Date();
    } else {
      tokens.push({
        token,
        platform: safePlatform,
        deviceName: deviceName || '',
      });
    }

    req.user.pushTokens = tokens;
    await req.user.save();
    res.json({ message: 'Push token registered', count: tokens.length });
  } catch (error) {
    next(error);
  }
};

exports.unregisterPushToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    req.user.pushTokens = (req.user.pushTokens || []).filter((t) => t.token !== token);
    await req.user.save();
    res.json({ message: 'Push token removed' });
  } catch (error) {
    next(error);
  }
};

exports.sendTestPush = async (req, res, next) => {
  try {
    const tokens = req.user.pushTokens || [];
    if (tokens.length === 0) {
      return res.status(400).json({ message: 'No registered devices. Enable push notifications first.' });
    }

    const result = await sendUserPush(req.user, {
      title: 'QueueBook test',
      body: 'This is a test push notification from QueueBook. Vibration follows your notification preference.',
      data: { type: 'test_push' },
    });

    const expoOk = result.expo.filter((ticket) => ticket?.status === 'ok').length;
    const webOk = result.web.filter((t) => t.ok).length;
    const sent = expoOk + webOk;

    res.json({
      message: sent > 0 ? 'Test push sent' : 'Test push could not be delivered',
      sent,
      devices: tokens.length,
      results: { expo: result.expo, web: result.web },
    });
  } catch (error) {
    next(error);
  }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ notification });
  } catch (error) {
    next(error);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'All marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.getMessageLogs = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'business') {
      const business = await Business.findOne({ owner: req.user._id });
      if (!business) {
        return res.json({ logs: [], message: 'No business profile yet' });
      }
      filter.business = business._id;
    } else {
      filter.user = req.user._id;
    }

    const logs = await MessageLog.find(filter)
      .populate('user', 'name phone')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ logs });
  } catch (error) {
    next(error);
  }
};
