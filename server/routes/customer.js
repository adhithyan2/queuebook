const express = require('express');
const { getDashboard, getNearbyBusinesses, getExploreBusinesses, getBusinessReviews, getBusinessPublic, getAvailableSlots, verifyQueueToken, updateProfile, compareServices, getCrowdAnalytics, getBestTimes, getExpectedQueue } = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, getDashboard);
router.get('/nearby', protect, getNearbyBusinesses);
router.get('/explore', protect, getExploreBusinesses);
router.get('/compare', protect, compareServices);
router.get('/reviews/:businessId', protect, getBusinessReviews);
router.get('/public/:businessId', getBusinessPublic);
router.get('/business/:businessId/crowd-analytics', getCrowdAnalytics);
router.get('/business/:businessId/best-times', getBestTimes);
router.get('/business/:businessId/expected-queue', getExpectedQueue);
router.get('/slots', protect, getAvailableSlots);
router.get('/verify/:queueId', verifyQueueToken);
router.put('/profile', protect, updateProfile);

module.exports = router;
