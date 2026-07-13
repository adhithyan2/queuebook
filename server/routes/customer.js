const express = require('express');
const { getDashboard, getNearbyBusinesses, getBusinessReviews } = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, getDashboard);
router.get('/nearby', protect, getNearbyBusinesses);
router.get('/reviews/:businessId', protect, getBusinessReviews);

module.exports = router;
