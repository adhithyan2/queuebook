const Notification = require('../models/Notification');
const MessageLog = require('../models/MessageLog');
const Business = require('../models/Business');

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
