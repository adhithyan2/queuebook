const express = require('express');
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markRead);
router.put('/read-all', protect, markAllRead);

module.exports = router;
