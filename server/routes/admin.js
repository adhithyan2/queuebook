const express = require('express');
const { getUsers, getBusinesses, getReports, getAnalytics, setBusinessApproval } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/users', protect, authorize('admin'), getUsers);
router.get('/businesses', protect, authorize('admin'), getBusinesses);
router.get('/reports', protect, authorize('admin'), getReports);
router.get('/analytics', protect, authorize('admin'), getAnalytics);
router.put('/businesses/:id/approval', protect, authorize('admin'), setBusinessApproval);

module.exports = router;
