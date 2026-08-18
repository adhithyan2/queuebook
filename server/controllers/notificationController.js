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

exports.testPush = async (req, res, next) => {
  try {
    const result = await sendUserPush(req.user, {
      title: 'QueueBook Test',
      body: 'Push notifications are working! You will receive alerts when your queue position updates.',
      data: { type: 'test' },
    });
    res.json({ message: 'Test push sent', result });
  } catch (error) {
    next(error);
  }
};
