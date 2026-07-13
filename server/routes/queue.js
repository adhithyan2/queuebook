const express = require('express');
const { joinQueue, getMyQueue, getQueueStatus, leaveQueue } = require('../controllers/queueController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, joinQueue);
router.get('/my', protect, getMyQueue);
router.get('/:id/status', protect, getQueueStatus);
router.put('/:id/leave', protect, leaveQueue);

module.exports = router;
