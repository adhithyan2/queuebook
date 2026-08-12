const express = require('express');
const { getNotifications, markRead, markAllRead, getMessageLogs } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/logs', protect, getMessageLogs);
router.put('/:id/read', protect, markRead);
router.put('/read-all', protect, markAllRead);

module.exports = router;
