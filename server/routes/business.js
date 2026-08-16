const express = require('express');
const { getDashboard, getProfile, createOrUpdateProfile, callNext, skipCustomer, completeAppointment, getAnalytics, getCrowdAnalytics, addWalkIn, addService, updateService, deleteService, addStaff, updateStaff, deleteStaff } = require('../controllers/businessController');
const { verifyAppointmentPayment, collectQueuePayment } = require('../controllers/paymentController');
const { checkInAppointment, markNoShow } = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, authorize('business'), getDashboard);
router.get('/profile', protect, authorize('business'), getProfile);
router.post('/profile', protect, authorize('business'), createOrUpdateProfile);
router.put('/profile', protect, authorize('business'), createOrUpdateProfile);
router.get('/analytics', protect, authorize('business'), getAnalytics);
router.get('/analytics/crowd', protect, authorize('business'), getCrowdAnalytics);
router.post('/queue/call-next', protect, authorize('business'), callNext);
router.put('/queue/:id/skip', protect, authorize('business'), skipCustomer);
router.put('/queue/:id/complete', protect, authorize('business'), completeAppointment);
router.put('/queue/:id/pay', protect, authorize('business'), collectQueuePayment);
router.put('/appointments/:id/payment/verify', protect, authorize('business'), verifyAppointmentPayment);
router.put('/appointments/:id/checkin', protect, authorize('business'), checkInAppointment);
router.put('/appointments/:id/no-show', protect, authorize('business'), markNoShow);
router.post('/queue/walkin', protect, authorize('business'), addWalkIn);
router.post('/services', protect, authorize('business'), addService);
router.put('/services/:serviceId', protect, authorize('business'), updateService);
router.delete('/services/:serviceId', protect, authorize('business'), deleteService);
router.post('/staff', protect, authorize('business'), addStaff);
router.put('/staff/:staffId', protect, authorize('business'), updateStaff);
router.delete('/staff/:staffId', protect, authorize('business'), deleteStaff);

module.exports = router;
