const express = require('express');
const { getDashboard, getProfile, createOrUpdateProfile, callNext, skipCustomer, completeAppointment, getAnalytics, addWalkIn } = require('../controllers/businessController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, authorize('business'), getDashboard);
router.get('/profile', protect, authorize('business'), getProfile);
router.post('/profile', protect, authorize('business'), createOrUpdateProfile);
router.put('/profile', protect, authorize('business'), createOrUpdateProfile);
router.get('/analytics', protect, authorize('business'), getAnalytics);
router.post('/queue/call-next', protect, authorize('business'), callNext);
router.put('/queue/:id/skip', protect, authorize('business'), skipCustomer);
router.put('/queue/:id/complete', protect, authorize('business'), completeAppointment);
router.post('/queue/walkin', protect, authorize('business'), addWalkIn);

module.exports = router;
