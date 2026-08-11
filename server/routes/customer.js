const express = require('express');
const { getDashboard, getNearbyBusinesses, getBusinessReviews, getBusinessPublic, verifyQueueToken, updateProfile } = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, getDashboard);
router.get('/nearby', protect, getNearbyBusinesses);
router.get('/reviews/:businessId', protect, getBusinessReviews);
router.get('/public/:businessId', getBusinessPublic);
router.get('/verify/:queueId', verifyQueueToken);
router.put('/profile', protect, updateProfile);

module.exports = router;
