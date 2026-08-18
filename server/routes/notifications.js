const express = require('express');
const { getNotifications, markRead, markAllRead, getMessageLogs, registerPushToken, unregisterPushToken, testPush } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { getVapidPublicKey } = require('../services/pushService');

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/logs', protect, getMessageLogs);
router.put('/:id/read', protect, markRead);
router.put('/read-all', protect, markAllRead);
router.post('/push-token', protect, registerPushToken);
router.delete('/push-token', protect, unregisterPushToken);
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});
router.post('/test-push', protect, testPush);

module.exports = router;
